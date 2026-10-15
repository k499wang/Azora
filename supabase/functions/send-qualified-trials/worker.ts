import { buildQualifiedTrialEvent, qualifyTrial } from './qualifiedTrial.ts';
import type { Subscriber, TrialJob } from './qualifiedTrial.ts';

export interface TrialConfig {
  cronSecret: string;
  revenueCatKey: string;
  appsFlyerDevKey: string;
  iosAppId: string;
  androidAppId?: string;
}

export type TrialOutcome = 'pending' | 'suppressed' | 'sent' | 'failed' | 'uncertain';
export interface TrialDatabase {
  claim(stores: TrialJob['store'][]): Promise<TrialJob[]>;
  prepare(job: TrialJob): Promise<boolean>;
  finish(job: TrialJob, status: TrialOutcome, error?: string): Promise<boolean>;
}

export function validateTrialConfig(config: TrialConfig): boolean {
  return Boolean(config.cronSecret.length >= 32 && config.revenueCatKey && config.appsFlyerDevKey
    && /^id\d+$/.test(config.iosAppId)
    && (!config.androidAppId || /^[a-zA-Z]\w*(?:\.[a-zA-Z]\w*)+$/.test(config.androidAppId)));
}

// Keep both the request and body read inside the deadline.
async function readSubscriber(fetcher: typeof fetch, config: TrialConfig, job: TrialJob): Promise<Subscriber> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetcher(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(job.app_user_id)}`, {
      headers: { authorization: `Bearer ${config.revenueCatKey}` }, signal: controller.signal,
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`RevenueCat HTTP ${response.status}`);
    }
    const body = await response.json();
    if (!body?.subscriber || typeof body.subscriber !== 'object') throw new Error('Invalid RevenueCat response');
    return body.subscriber as Subscriber;
  } finally { clearTimeout(timer); }
}

export function createQualifiedTrialHandler(config: TrialConfig, database: TrialDatabase, fetcher: typeof fetch = fetch,
  now: () => number = Date.now): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
    if (!config.cronSecret || request.headers.get('authorization') !== `Bearer ${config.cronSecret}`) {
      return new Response('unauthorized', { status: 401 });
    }
    // Configuration failures leave the queue untouched, including retry counts.
    if (!validateTrialConfig(config)) return new Response('qualified trial configuration incomplete', { status: 503 });

    const counts: Record<string, number> = { claimed: 0, sent: 0, suppressed: 0, pending: 0, failed: 0, uncertain: 0, skipped: 0 };
    try {
      const stores: TrialJob['store'][] = config.androidAppId ? ['APP_STORE', 'PLAY_STORE'] : ['APP_STORE'];
      const jobs = await database.claim(stores);
      counts.claimed = jobs.length;
      // Five claims run together so slow providers cannot exhaust later jobs' leases.
      const results = await Promise.allSettled(jobs.map(async (job) => {
        let dispatched = false;
        try {
          const appId = job.store === 'APP_STORE' ? config.iosAppId : config.androidAppId;
          if (!appId) throw new Error('AppsFlyer Android app ID missing');
          const subscriber = await readSubscriber(fetcher, config, job);
          const qualification = qualifyTrial(job, subscriber, now());
          if (qualification.status !== 'qualified') {
            const outcome = qualification.status === 'pending' && job.attempts >= 5 ? 'failed' : qualification.status;
            if (!await database.finish(job, outcome, qualification.reason)) throw new Error('Trial lease lost');
            counts[outcome] += 1;
            return;
          }
          const body = JSON.stringify(buildQualifiedTrialEvent(job, subscriber));
          if (!await database.prepare(job)) { counts.skipped += 1; return; }
          // From this point even a transport error can mean AppsFlyer accepted the event.
          dispatched = true;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          let response: Response;
          try {
            response = await fetcher(`https://api2.appsflyer.com/inappevent/${encodeURIComponent(appId)}`, {
              method: 'POST', headers: { 'content-type': 'application/json', authentication: config.appsFlyerDevKey },
              body, signal: controller.signal,
            });
            await response.body?.cancel();
          } finally { clearTimeout(timer); }
          // 4xx is an explicit rejection. 5xx leaves delivery ambiguous and needs manual review.
          const outcome = response.ok ? 'sent' : response.status >= 400 && response.status < 500 ? 'failed' : 'uncertain';
          const error = response.ok ? undefined : `AppsFlyer HTTP ${response.status}`;
          if (!await database.finish(job, outcome, error)) throw new Error('Could not persist AppsFlyer outcome');
          counts[outcome] += 1;
        } catch (error) {
          const outcome = dispatched ? 'uncertain' : job.attempts >= 5 ? 'failed' : 'pending';
          // Never include provider response bodies or credentials in logs or queue errors.
          const reason = error instanceof Error ? error.message : 'Qualified trial processing failed';
          if (!await database.finish(job, outcome, reason)) {
            throw new Error('Could not persist qualified trial outcome');
          }
          counts[outcome] += 1;
        }
      }));
      if (results.some((result) => result.status === 'rejected')) throw new Error('Qualified trial outcome write failed');
      return Response.json({ ok: true, ...counts });
    } catch {
      return new Response('qualified trial queue processing failed', { status: 500 });
    }
  };
}

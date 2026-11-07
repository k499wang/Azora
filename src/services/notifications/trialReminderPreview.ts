import { ONBOARDING_INTENT_LOOKUP_OPTIONS } from '../../components/onboarding/data/intentOptions';
import { buildIntentTitleLookup, resolvePlanIntent } from '../../lib/planProgress';
import { getSavedOnboardingProfile } from '../profile/onboardingStatusService';
import { buildTrialEndingContent } from './notificationCatalog';
import {
  ensureNotificationChannels,
  registerNotificationHandler,
  requestNotificationPermissions,
  scheduleDateNotification,
} from './notificationClient';
import { getTrialRecapCounts } from './trialRecapService';

const PREVIEW_TRIAL_DAYS_LEFT = 2;
const PREVIEW_DELAY_MS = 5000;

/** Dev only: fires the real reminder from this account's real counts. */
export async function sendTrialReminderPreview(userId: string): Promise<void> {
  registerNotificationHandler();
  await ensureNotificationChannels();
  await requestNotificationPermissions();
  const trialEndsAt = new Date(Date.now() + PREVIEW_TRIAL_DAYS_LEFT * 24 * 60 * 60 * 1000);
  const recap = await getTrialRecapCounts(userId, trialEndsAt.toISOString());
  const profile = await getSavedOnboardingProfile(userId);
  const goal = resolvePlanIntent(profile?.onboardingGoal, buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS));
  const content = buildTrialEndingContent(trialEndsAt, recap, goal);
  await scheduleDateNotification({
    identifier: 'dev-trial-reminder-preview',
    title: content.title,
    body: content.body,
    data: content.data,
    channelId: content.channelId,
    date: new Date(Date.now() + PREVIEW_DELAY_MS),
  });
}

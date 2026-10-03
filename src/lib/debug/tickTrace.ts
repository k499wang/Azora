/**
 * TEMPORARY: a dev-only timeline of one to-do tick, to find where a slow
 * disappear and a stuck coin pill lose their time. Delete with its call sites.
 */
const LAG_SAMPLE_MS = 100;
const LAG_REPORT_MS = 250;

let tappedAt = 0;
let lagWatch: ReturnType<typeof setInterval> | null = null;

function watchJsLag() {
  if (lagWatch != null) return;
  let expected = Date.now() + LAG_SAMPLE_MS;
  lagWatch = setInterval(() => {
    const now = Date.now();
    const late = now - expected;
    if (late > LAG_REPORT_MS) {
      console.log(`[tick] +${now - tappedAt}ms JS THREAD BLOCKED for ${late}ms`);
    }
    expected = now + LAG_SAMPLE_MS;
  }, LAG_SAMPLE_MS);
}

export function traceTap(detail: Record<string, unknown>) {
  if (!__DEV__) return;
  watchJsLag();
  tappedAt = Date.now();
  console.log('[tick] +0ms tap', detail);
}

export function traceTick(event: string, detail?: Record<string, unknown>) {
  if (!__DEV__) return;
  console.log(`[tick] +${Date.now() - tappedAt}ms ${event}`, detail ?? '');
}

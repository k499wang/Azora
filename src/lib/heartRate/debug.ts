import type { HeartRateEstimate } from './types';
import type { ComputeBpmComparison } from './signalProcessing';

type DebugValue = boolean | number | string | null;
type DebugDetails = Record<string, DebugValue>;

function isDevBuild(): boolean {
  const devFlag = (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__;
  return devFlag !== false;
}

function formatEstimate(estimate: HeartRateEstimate | null): string {
  if (estimate == null) return '--';

  return [
    `${estimate.bpm}bpm`,
    `${estimate.channel}/${estimate.roiId}`,
    `conf=${estimate.confidence.toFixed(2)}`,
    `snr=${estimate.snrDb.toFixed(1)}`,
  ].join(' ');
}

export function logHeartRateComparison(
  source: 'capture-preview' | 'live-pulse' | 'stream',
  comparison: ComputeBpmComparison,
): void {
  if (!isDevBuild()) return;

  console.log(
    `[HeartRate:${source}] original=${formatEstimate(comparison.original)} ` +
      `pulseHue=${formatEstimate(comparison.pulseHue)} ` +
      `final=${formatEstimate(comparison.consensus)}`,
  );
}

export function logHeartRateStatus(
  source: 'capture-preview' | 'live-pulse' | 'stream',
  event: string,
  details: DebugDetails = {},
): void {
  if (!isDevBuild()) return;

  const detailText = Object.entries(details)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');

  console.log(
    detailText.length > 0
      ? `[HeartRate:${source}:status] ${event} ${detailText}`
      : `[HeartRate:${source}:status] ${event}`,
  );
}

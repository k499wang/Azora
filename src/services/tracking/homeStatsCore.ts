import type { StressHistoryEntry } from '../../lib/heartRate/stress';

type StressHistorySourceEntry = { stress: number | null; localDate: string };

export function buildStressHistory(
  heartRateHistory: StressHistorySourceEntry[],
  breathHoldHistory: StressHistorySourceEntry[],
): StressHistoryEntry[] {
  return [
    ...heartRateHistory,
    ...breathHoldHistory,
  ].map((s) => ({
    stress: s.stress ?? null,
    localDate: s.localDate,
  }));
}

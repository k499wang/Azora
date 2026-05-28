import type { StressHistoryEntry } from '../../lib/heartRate/stress';

type StressHistorySourceEntry = { stress: number | null; localDate: string };

export function buildStressHistory(
  heartRateHistory: StressHistorySourceEntry[],
): StressHistoryEntry[] {
  return heartRateHistory.map((s) => ({
    stress: s.stress ?? null,
    localDate: s.localDate,
  }));
}

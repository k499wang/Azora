export type {
  HeartRateStats,
  HeartRateStatsPartialErrors,
  HrSourcePick,
} from './heartRateStatsCore';
export { pickHrSource } from './heartRateStatsCore';

/** Load the data required by the dedicated Heart tab. */
export async function getHeartRateStats(userId: string, todayLocalDate: string) {
  void userId;
  void todayLocalDate;
  const { MOCK_HEART_RATE_STATS } = await import('../../dev/mockScreenshotData');
  return MOCK_HEART_RATE_STATS;
}

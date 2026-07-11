export interface ProfileSummary {
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    timezone: string;
  } | null;
  longestHoldSeconds: number | null;
  breathHoldCount: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  completedDays: number[];
  completedDaysAgo: number[];
  breathHoldTrend: Array<{
    label: string;
    value: number;
  }>;
  partialErrors: ProfileSummaryPartialErrors;
}

export interface ProfileSummaryPartialErrors {
  profile: boolean;
  longestHold: boolean;
  breathHoldCount: boolean;
  activeDays: boolean;
  streak: boolean;
  completedDays: boolean;
  breathHoldTrend: boolean;
}

function secondsToDisplay(totalSeconds: number | null): string {
  if (totalSeconds == null) {
    return '0:00';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export function formatProfileHoldTime(totalSeconds: number | null): string {
  return secondsToDisplay(totalSeconds);
}

export async function getProfileSummary(userId: string): Promise<ProfileSummary> {
  void userId;
  const { MOCK_PROFILE_SUMMARY } = await import('../../dev/mockScreenshotData');
  return MOCK_PROFILE_SUMMARY;
}

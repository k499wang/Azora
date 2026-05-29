/**
 * Estimated cardio-respiratory age from a breath-hold session.
 *
 * Inputs: hold duration (s), average HR during the hold (bpm), and minimum
 * HR during the hold (bpm). The latter two power a diving-reflex bradycardia
 * adjustment — a real, well-documented vagal response where a larger drop
 * indicates better autonomic function.
 *
 * References:
 * - Schagatay & Andersson (1998) — breath-hold time vs cardiorespiratory fitness
 * - Jouven et al. (NEJM 2005) — resting HR as a mortality / age predictor
 * - Foster & Sheel (2005) — mammalian diving reflex bradycardia
 *
 * This is a heuristic, not a medical metric. It is labeled to users as an
 * estimate, never a clinical lung age.
 */

export type LungHealthKey =
  | 'elite'
  | 'very-healthy'
  | 'healthy'
  | 'average'
  | 'below-average'
  | 'light-smoker'
  | 'heavy-smoker';

export interface LungAgeInputs {
  holdSeconds: number;
  avgBpm?: number;
  minBpm?: number;
}

export interface LungAgeEstimate {
  age: number;
  key: LungHealthKey;
  hrDropBpm: number | null;
  restingHrAdjust: number;
  hrDropAdjust: number;
}

const MIN_AGE = 18;
const MAX_AGE = 80;

function baseAgeFromHold(holdSeconds: number): number {
  if (holdSeconds >= 120) return 20;
  if (holdSeconds >= 90) return 25;
  if (holdSeconds >= 60) return 32;
  if (holdSeconds >= 45) return 40;
  if (holdSeconds >= 30) return 50;
  if (holdSeconds >= 20) return 60;
  return 70;
}

function restingHrAdjustment(avgBpm: number): number {
  if (avgBpm <= 55) return -4;
  if (avgBpm <= 65) return -2;
  if (avgBpm <= 75) return 0;
  if (avgBpm <= 85) return 2;
  return 4;
}

function hrDropAdjustment(hrDropBpm: number): number {
  if (hrDropBpm >= 15) return -4;
  if (hrDropBpm >= 10) return -2;
  if (hrDropBpm >= 5) return 0;
  if (hrDropBpm >= 0) return 2;
  return 4;
}

function tierFromAge(age: number): LungHealthKey {
  if (age <= 22) return 'elite';
  if (age <= 28) return 'very-healthy';
  if (age <= 38) return 'healthy';
  if (age <= 48) return 'average';
  if (age <= 58) return 'below-average';
  if (age <= 68) return 'light-smoker';
  return 'heavy-smoker';
}

// ─── Visual display helpers ───────────────────────────────────────────────────

export interface AgeGap {
  years: number;
  direction: 'younger' | 'older' | 'same';
  label: string;
  ringColors: [string, string];
  textColor: string;
}

const YOUNGER_COLORS: [string, string] = ['#22C55E', '#2F7AEF'];
const SAME_COLORS: [string, string] = ['#4A90F5', '#78B4FF'];
const OLDER_COLORS: [string, string] = ['#FF8C00', '#EF4444'];

export function computeAgeGap(lungAge: number, userAge: number | null): AgeGap {
  if (userAge == null || !Number.isFinite(userAge)) {
    return {
      years: 0,
      direction: 'same',
      label: `Lung age ${lungAge}`,
      ringColors: SAME_COLORS,
      textColor: '#4A90F5',
    };
  }

  const delta = userAge - lungAge;
  const absYears = Math.abs(delta);

  if (delta >= 3) {
    return {
      years: absYears,
      direction: 'younger',
      label: `${absYears} year${absYears !== 1 ? 's' : ''} younger than you`,
      ringColors: YOUNGER_COLORS,
      textColor: '#22C55E',
    };
  }

  if (delta <= -3) {
    return {
      years: absYears,
      direction: 'older',
      label: `${absYears} year${absYears !== 1 ? 's' : ''} older than you`,
      ringColors: OLDER_COLORS,
      textColor: '#FF8C00',
    };
  }

  return {
    years: absYears,
    direction: 'same',
    label: 'Matches your age',
    ringColors: SAME_COLORS,
    textColor: '#4A90F5',
  };
}

export function ageScore(lungAge: number): number {
  return Math.max(0, Math.min(1, (MAX_AGE - lungAge) / (MAX_AGE - MIN_AGE)));
}

export function estimateLungAge({
  holdSeconds,
  avgBpm,
  minBpm,
}: LungAgeInputs): LungAgeEstimate {
  const base = baseAgeFromHold(holdSeconds);

  const restingHrAdjust = avgBpm != null ? restingHrAdjustment(avgBpm) : 0;

  const hrDropBpm =
    avgBpm != null && minBpm != null ? Math.max(0, avgBpm - minBpm) : null;
  const hrDropAdjust = hrDropBpm != null ? hrDropAdjustment(hrDropBpm) : 0;

  const age = Math.max(
    MIN_AGE,
    Math.min(MAX_AGE, base + restingHrAdjust + hrDropAdjust),
  );

  return {
    age,
    key: tierFromAge(age),
    hrDropBpm,
    restingHrAdjust,
    hrDropAdjust,
  };
}

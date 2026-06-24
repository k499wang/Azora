/**
 * Azora Score — a 0–100 measure of breath-hold performance from a single session.
 *
 * Higher is better. Longer holds and a larger diving-reflex bradycardia (the
 * heart-rate drop during the hold) both raise the score; a lower average heart
 * rate during the hold lifts it slightly more. Partly reflects the mammalian
 * diving reflex.
 *
 * References:
 * - Schagatay & Andersson (1998) — breath-hold time vs cardiorespiratory fitness
 * - Foster & Sheel (2005) — mammalian diving reflex bradycardia
 *
 * This is a heuristic, not a medical metric.
 */

import { colors } from '../theme/colors';

export type AzoraTierKey =
  | 'elite'
  | 'strong'
  | 'solid'
  | 'steady'
  | 'building'
  | 'beginner';

export interface AzoraScoreInputs {
  holdSeconds: number;
  avgBpm?: number;
  minBpm?: number;
}

export interface AzoraScoreEstimate {
  score: number;
  key: AzoraTierKey;
  hrDropBpm: number | null;
  restingHrAdjust: number;
  hrDropAdjust: number;
}

const MIN_SCORE = 0;
const MAX_SCORE = 100;

function baseScoreFromHold(holdSeconds: number): number {
  if (holdSeconds >= 120) return 95;
  if (holdSeconds >= 90) return 85;
  if (holdSeconds >= 60) return 72;
  if (holdSeconds >= 45) return 60;
  if (holdSeconds >= 30) return 48;
  if (holdSeconds >= 20) return 35;
  return 22;
}

function restingHrAdjustment(avgBpm: number): number {
  if (avgBpm <= 55) return 5;
  if (avgBpm <= 65) return 3;
  if (avgBpm <= 75) return 0;
  if (avgBpm <= 85) return -3;
  return -5;
}

function hrDropAdjustment(hrDropBpm: number): number {
  if (hrDropBpm >= 15) return 5;
  if (hrDropBpm >= 10) return 3;
  if (hrDropBpm >= 5) return 0;
  if (hrDropBpm >= 0) return -3;
  return -5;
}

function tierFromScore(score: number): AzoraTierKey {
  if (score >= 90) return 'elite';
  if (score >= 75) return 'strong';
  if (score >= 60) return 'solid';
  if (score >= 45) return 'steady';
  if (score >= 30) return 'building';
  return 'beginner';
}

// ─── Visual display helpers ───────────────────────────────────────────────────

export interface AzoraTierMeta {
  label: string;
  ringColors: [string, string];
  textColor: string;
  pillBg: string;
  direction: 'positive' | 'neutral';
}

const STRONG_COLORS: [string, string] = [colors.success[500], colors.primary.blue500];
const NEUTRAL_COLORS: [string, string] = [colors.primary.blue500, colors.primary.blue400];
const LOW_COLORS: [string, string] = [colors.orange[500], colors.error[500]];

const TIER_META: Record<AzoraTierKey, AzoraTierMeta> = {
  elite: { label: 'Elite', ringColors: STRONG_COLORS, textColor: colors.success[500], pillBg: colors.success[100], direction: 'positive' },
  strong: { label: 'Strong', ringColors: STRONG_COLORS, textColor: colors.success[500], pillBg: colors.success[100], direction: 'positive' },
  solid: { label: 'Solid', ringColors: NEUTRAL_COLORS, textColor: colors.primary.blue500, pillBg: colors.primary.blue100, direction: 'neutral' },
  steady: { label: 'Steady', ringColors: NEUTRAL_COLORS, textColor: colors.primary.blue500, pillBg: colors.primary.blue100, direction: 'neutral' },
  building: { label: 'Building up', ringColors: LOW_COLORS, textColor: colors.orange[500], pillBg: colors.orange[100], direction: 'neutral' },
  beginner: { label: 'Just starting', ringColors: LOW_COLORS, textColor: colors.orange[500], pillBg: colors.orange[100], direction: 'neutral' },
};

export function azoraTierMeta(key: AzoraTierKey): AzoraTierMeta {
  return TIER_META[key];
}

/** Tiers from lowest to highest. Index doubles as the level number (0-based). */
export const AZORA_TIER_ORDER: AzoraTierKey[] = [
  'beginner',
  'building',
  'steady',
  'solid',
  'strong',
  'elite',
];

const TIER_MIN_SCORE: Record<AzoraTierKey, number> = {
  beginner: 0,
  building: 30,
  steady: 45,
  solid: 60,
  strong: 75,
  elite: 90,
};

export interface AzoraLevel {
  key: AzoraTierKey;
  label: string;
  minScore: number;
  maxScore: number;
}

export function azoraLevels(): AzoraLevel[] {
  return AZORA_TIER_ORDER.map((key, i) => {
    const next = AZORA_TIER_ORDER[i + 1];
    return {
      key,
      label: TIER_META[key].label,
      minScore: TIER_MIN_SCORE[key],
      maxScore: next != null ? TIER_MIN_SCORE[next] - 1 : MAX_SCORE,
    };
  });
}

export function azoraScoreFill(score: number): number {
  return Math.max(0, Math.min(1, score / MAX_SCORE));
}

export function estimateAzoraScore({
  holdSeconds,
  avgBpm,
  minBpm,
}: AzoraScoreInputs): AzoraScoreEstimate {
  const base = baseScoreFromHold(holdSeconds);

  const restingHrAdjust = avgBpm != null ? restingHrAdjustment(avgBpm) : 0;

  const hrDropBpm =
    avgBpm != null && minBpm != null ? Math.max(0, avgBpm - minBpm) : null;
  const hrDropAdjust = hrDropBpm != null ? hrDropAdjustment(hrDropBpm) : 0;

  const score = Math.round(
    Math.max(MIN_SCORE, Math.min(MAX_SCORE, base + restingHrAdjust + hrDropAdjust)),
  );

  return {
    score,
    key: tierFromScore(score),
    hrDropBpm,
    restingHrAdjust,
    hrDropAdjust,
  };
}

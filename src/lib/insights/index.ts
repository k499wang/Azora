import {
  getStressStats,
  getStressZone,
  type StressHistoryEntry,
} from '../heartRate/stress';
import { pickRecommendation } from './recommendations';

export interface InsightContext {
  rmssd: number | null;
  avgRmssd: number | null;
  sdnn: number | null;
  hrDrop: number | null;
  minBpm: number | null;
  stress: number | null;
  stressHistory: StressHistoryEntry[];
  todayHoldSeconds: number | null;
  bestHoldSeconds: number | null;
}

export interface Insight {
  id: string;
  eyebrow: string;
  tone: string;
  detail: string;
  techniqueId?: string;
  ctaLabel?: string;
}

export type InsightBuilder = (ctx: InsightContext) => Insight | null;

const exerciseRecommendation: InsightBuilder = (ctx) => {
  const pick = pickRecommendation(ctx);
  if (!pick) return null;

  return {
    id: `recommend-${pick.techniqueId}`,
    eyebrow: 'Recommended for you',
    tone: pick.techniqueName,
    detail: `Try ${pick.techniqueName} — ${pick.reason}.`,
    techniqueId: pick.techniqueId,
    ctaLabel: `Start • ${pick.duration}`,
  };
};

const heartInsight: InsightBuilder = ({ rmssd, avgRmssd, hrDrop, minBpm }) => {
  if (rmssd != null && avgRmssd != null && avgRmssd > 0) {
    const deltaPct = Math.round(((rmssd - avgRmssd) / avgRmssd) * 100);
    if (deltaPct >= 10) {
      return {
        id: 'hrv-above-baseline',
        eyebrow: 'Heart insight',
        tone: 'HRV above baseline',
        detail: `Your RMSSD is ${deltaPct}% above your 7-day average — a sign your nervous system is recovering well today.`,
      };
    }
    if (deltaPct <= -15) {
      return {
        id: 'hrv-below-baseline',
        eyebrow: 'Heart insight',
        tone: 'HRV below baseline',
        detail: `Your RMSSD is ${Math.abs(deltaPct)}% below your 7-day average. Consider an easier day or more sleep.`,
      };
    }
    return {
      id: 'hrv-steady',
      eyebrow: 'Heart insight',
      tone: 'HRV holding steady',
      detail: `Your RMSSD is in line with your 7-day average (${Math.round(avgRmssd)} ms) — consistency is the goal.`,
    };
  }

  if (hrDrop != null) {
    if (hrDrop >= 15) {
      return {
        id: 'hr-drop-strong',
        eyebrow: 'Heart insight',
        tone: 'Strong vagal response',
        detail: `Your heart rate dropped ${hrDrop} bpm during the hold — a strong parasympathetic signal.`,
      };
    }
    if (hrDrop >= 8) {
      return {
        id: 'hr-drop-moderate',
        eyebrow: 'Heart insight',
        tone: 'Moderate recovery response',
        detail: `Your heart rate eased down ${hrDrop} bpm. Slower exhales can deepen this drop.`,
      };
    }
    return {
      id: 'hr-drop-low',
      eyebrow: 'Heart insight',
      tone: 'Limited HR drop',
      detail: `Only a ${hrDrop} bpm drop this session — try a longer, slower exhale to engage the vagus nerve.`,
    };
  }

  if (minBpm != null) {
    return {
      id: 'min-bpm',
      eyebrow: 'Heart insight',
      tone: 'Resting low recorded',
      detail: `Your lowest HR this session was ${minBpm} bpm — a useful baseline as you build consistency.`,
    };
  }

  return null;
};

const recoveryInsight: InsightBuilder = ({ rmssd, sdnn, hrDrop }) => {
  if (rmssd == null || sdnn == null) return null;

  if (rmssd >= 55 && sdnn >= 45) {
    return {
      id: 'recovery-strong',
      eyebrow: 'Recovery insight',
      tone: 'Strong recovery',
      detail:
        hrDrop != null && hrDrop > 0
          ? `Your variability looks strong and your heart rate settled by ${hrDrop} bpm during recovery.`
          : 'Your variability looks strong, with a stable recovery pattern through the session.',
    };
  }
  if (rmssd >= 35 && sdnn >= 30) {
    return {
      id: 'recovery-balanced',
      eyebrow: 'Recovery insight',
      tone: 'Balanced pattern',
      detail:
        hrDrop != null && hrDrop > 0
          ? `Your breath hold shows a steady recovery response, with heart rate easing down by ${hrDrop} bpm.`
          : 'Your variability sits in a balanced range, though recovery looks flatter than usual.',
    };
  }
  return {
    id: 'recovery-muted',
    eyebrow: 'Recovery insight',
    tone: 'Recovery is muted',
    detail:
      hrDrop != null && hrDrop > 0
        ? `Variability is on the lower side. A ${hrDrop} bpm drop still shows some recovery, but stress or fatigue may be elevated.`
        : 'Variability is on the lower side — common when stress, fatigue, or inconsistent breathing is higher.',
  };
};

const stressInsight: InsightBuilder = ({ stress, stressHistory }) => {
  const stats = getStressStats(stressHistory);

  if (stats.trendVsPriorWeek != null) {
    const delta = stats.trendVsPriorWeek;
    if (delta <= -5) {
      return {
        id: 'stress-down',
        eyebrow: 'Stress insight',
        tone: 'Stress trending down',
        detail: `Your average stress is ${Math.abs(delta)} pts lower than last week — the routine is paying off.`,
      };
    }
    if (delta >= 5) {
      return {
        id: 'stress-up',
        eyebrow: 'Stress insight',
        tone: 'Stress trending up',
        detail: `Your average stress is ${delta} pts higher than last week. Prioritize sleep and longer exhales.`,
      };
    }
    return {
      id: 'stress-steady',
      eyebrow: 'Stress insight',
      tone: 'Stress holding steady',
      detail: `Your weekly stress average is stable vs last week (within ${Math.abs(delta)} pts).`,
    };
  }

  if (stats.lowZoneStreak >= 3) {
    return {
      id: 'stress-low-streak',
      eyebrow: 'Stress insight',
      tone: `${stats.lowZoneStreak}-day low-stress streak`,
      detail: 'Your daily best has stayed in the low zone — your baseline is shifting.',
    };
  }

  if (stats.bestThisWeek != null) {
    const zone = getStressZone(stats.bestThisWeek);
    return {
      id: 'stress-best-week',
      eyebrow: 'Stress insight',
      tone: `Best this week: ${stats.bestThisWeek}`,
      detail: `Your lowest stress reading this week landed in the ${zone.label.toLowerCase()} zone.`,
    };
  }

  if (stress != null) {
    const zone = getStressZone(stress);
    if (stress <= 33) {
      return {
        id: 'stress-calm',
        eyebrow: 'Stress insight',
        tone: 'Calm state',
        detail: `Your stress score (${stress}) is in the ${zone.label.toLowerCase()} zone — a good baseline.`,
      };
    }
    if (stress <= 66) {
      return {
        id: 'stress-balanced',
        eyebrow: 'Stress insight',
        tone: 'Balanced but elevated',
        detail: `Your stress score (${stress}) is in the ${zone.label.toLowerCase()} zone. A second slower-paced hold could bring it down.`,
      };
    }
    return {
      id: 'stress-high',
      eyebrow: 'Stress insight',
      tone: 'High stress reading',
      detail: `Your stress score (${stress}) is elevated. Try 4-second inhale / 8-second exhale for 2 minutes.`,
    };
  }

  return null;
};

export const INSIGHT_BUILDERS: InsightBuilder[] = [
  exerciseRecommendation,
  heartInsight,
  recoveryInsight,
  stressInsight,
];

export function buildInsights(ctx: InsightContext): Insight[] {
  return INSIGHT_BUILDERS.map((builder) => builder(ctx)).filter(
    (insight): insight is Insight => insight != null,
  );
}

export const SAMPLE_INSIGHTS: Insight[] = [
  {
    id: 'sample-recommend',
    eyebrow: 'Recommended for you',
    tone: 'Resonance',
    detail:
      "Try Resonance — coherent breathing maximizes HRV when you're in a balanced state.",
    techniqueId: 'resonance',
    ctaLabel: 'Start • ~2 min',
  },
  {
    id: 'sample-hrv',
    eyebrow: 'Heart insight',
    tone: 'HRV above baseline',
    detail:
      'Your RMSSD is 12% above your 7-day average — a sign your nervous system is recovering well today.',
  },
  {
    id: 'sample-recovery',
    eyebrow: 'Recovery insight',
    tone: 'Strong recovery',
    detail:
      'Your variability looks strong, with a stable recovery pattern through the session.',
  },
  {
    id: 'sample-stress',
    eyebrow: 'Stress insight',
    tone: 'Stress trending down',
    detail:
      'Your average stress is 6 pts lower than last week — the routine is paying off.',
  },
];

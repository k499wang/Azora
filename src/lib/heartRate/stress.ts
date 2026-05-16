import { colors } from '../../theme/colors';

export interface StressZone {
  label: string;
  color: string;
}

export function getStressZone(stress: number): StressZone {
  if (stress <= 33) return { label: 'Low', color: colors.primary.blue500 };
  if (stress <= 66) return { label: 'Moderate', color: colors.orange[500] };
  return { label: 'High', color: colors.orange[700] };
}

export interface StressHistoryEntry {
  stress: number | null;
  localDate: string;
}

export interface StressStats {
  count: number;
  avg: number | null;
  min: number | null;
  max: number | null;
  bestThisWeek: number | null;
  lowZoneStreak: number;
  trendVsPriorWeek: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseLocalDate(value: string): number {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
}

function startOfTodayMs(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export function getStressStats(entries: StressHistoryEntry[]): StressStats {
  const valid = entries.filter(
    (e): e is { stress: number; localDate: string } =>
      e.stress != null && Number.isFinite(e.stress),
  );

  if (valid.length === 0) {
    return {
      count: 0,
      avg: null,
      min: null,
      max: null,
      bestThisWeek: null,
      lowZoneStreak: 0,
      trendVsPriorWeek: null,
    };
  }

  const today = startOfTodayMs();
  const weekCutoff = today - 6 * DAY_MS;
  const priorWeekCutoff = today - 13 * DAY_MS;

  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let bestThisWeek: number | null = null;
  const bestByDay = new Map<string, number>();
  let weekSum = 0;
  let weekCount = 0;
  let priorWeekSum = 0;
  let priorWeekCount = 0;

  for (const entry of valid) {
    sum += entry.stress;
    if (entry.stress < min) min = entry.stress;
    if (entry.stress > max) max = entry.stress;

    const dayMs = parseLocalDate(entry.localDate);
    const existing = bestByDay.get(entry.localDate);
    if (existing == null || entry.stress < existing) {
      bestByDay.set(entry.localDate, entry.stress);
    }

    if (dayMs >= weekCutoff && dayMs <= today) {
      if (bestThisWeek == null || entry.stress < bestThisWeek) {
        bestThisWeek = entry.stress;
      }
      weekSum += entry.stress;
      weekCount += 1;
    } else if (dayMs >= priorWeekCutoff && dayMs < weekCutoff) {
      priorWeekSum += entry.stress;
      priorWeekCount += 1;
    }
  }

  let lowZoneStreak = 0;
  for (let i = 0; i < 365; i++) {
    const dayMs = today - i * DAY_MS;
    const d = new Date(dayMs);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const best = bestByDay.get(key);
    if (best == null) break;
    if (best > 33) break;
    lowZoneStreak += 1;
  }

  const trendVsPriorWeek =
    weekCount > 0 && priorWeekCount > 0
      ? Math.round(weekSum / weekCount) - Math.round(priorWeekSum / priorWeekCount)
      : null;

  return {
    count: valid.length,
    avg: Math.round(sum / valid.length),
    min,
    max,
    bestThisWeek,
    lowZoneStreak,
    trendVsPriorWeek,
  };
}

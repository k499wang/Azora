/**
 * The Azora Score: how much of the last week the user actually kept.
 *
 * One number on the plan screen, 0 to 100. It is **consistency**, not progress
 * through the plan — those are different questions and only one of them is
 * worth a gauge.
 *
 * Progress is already answered plainly, in days, by `planPositionLabel`. As a
 * score it would also be dishonest: the plan advances only when a day is
 * finished, so a progress gauge can only ever creep upwards and would read as
 * an achievement for having been here a while. `design.md`: numbers never
 * flatter.
 *
 * Consistency can fall. That is the point of it — a number that can only go up
 * is decoration, and this one is the same measure the product is actually
 * trying to move: days kept out of days asked for.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** The most days the score ever looks back over. */
export const AZORA_SCORE_WINDOW_DAYS = 7;

export type AzoraScoreBand = 'quiet' | 'building' | 'strong';

export interface AzoraScoreInput {
  /** Today, in the user's local calendar. The window ends here. */
  todayLocalDate: string;
  /**
   * Local dates the user kept — a day with something of the plan done on it.
   * Order does not matter and dates outside the window are ignored.
   */
  keptDates: readonly string[];
  /**
   * The day the plan started, so a plan three days old is scored out of three.
   *
   * Without it, somebody on day two is holding a 29 for having done everything
   * asked of them, which is a number that punishes people for being new.
   */
  startedOn: string | null;
}

export interface AzoraScore {
  /** 0 to 100. */
  score: number;
  daysKept: number;
  /** How many days the window actually covers: seven, or the plan's age. */
  daysAsked: number;
  band: AzoraScoreBand;
  /** Today is already one of the days kept. */
  todayKept: boolean;
}

// Date-only arithmetic, read as UTC midnights, so DST never shifts a day.
function toUtcMs(localDate: string): number {
  const [year, month, day] = localDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function daysBetweenLocalDates(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

function isLocalDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * The window, most recent first: today and the days behind it.
 *
 * Rolling rather than calendar-weekly. A week that resets on Monday makes the
 * number meaningless every Monday morning, and worst on the one day somebody
 * is most likely to be starting again.
 */
export function azoraScoreWindow(
  todayLocalDate: string,
  startedOn: string | null,
): readonly string[] {
  if (!isLocalDate(todayLocalDate)) return [];

  const age =
    startedOn == null || !isLocalDate(startedOn)
      ? AZORA_SCORE_WINDOW_DAYS
      : daysBetweenLocalDates(startedOn, todayLocalDate) + 1;
  const length = Math.max(1, Math.min(AZORA_SCORE_WINDOW_DAYS, age));

  const today = toUtcMs(todayLocalDate);
  return Array.from({ length }, (_, back) =>
    new Date(today - back * DAY_MS).toISOString().slice(0, 10),
  );
}

/** Where the week stands, for copy that has to say something about it. */
export function azoraScoreBand(score: number): AzoraScoreBand {
  if (score >= 71) return 'strong';
  if (score >= 36) return 'building';
  return 'quiet';
}

export function azoraScore(input: AzoraScoreInput): AzoraScore {
  const window = azoraScoreWindow(input.todayLocalDate, input.startedOn);
  const kept = new Set(input.keptDates);
  const daysKept = window.filter((date) => kept.has(date)).length;
  const daysAsked = window.length;
  const score = daysAsked === 0 ? 0 : Math.round((daysKept / daysAsked) * 100);

  return {
    score,
    daysKept,
    daysAsked,
    band: azoraScoreBand(score),
    todayKept: kept.has(input.todayLocalDate),
  };
}

/**
 * What the score becomes if today is kept, or nothing if it already is.
 *
 * The one forward-looking number on the card, and it is a fact rather than a
 * promise: the same window with one more day in it. It is also the answer to
 * the question a gauge invites — what would move this — which otherwise the
 * user has to guess at.
 */
export function azoraScoreIfTodayKept(score: AzoraScore): number | null {
  if (score.todayKept || score.daysAsked === 0) return null;
  return Math.round(((score.daysKept + 1) / score.daysAsked) * 100);
}

/**
 * The line under the ring.
 *
 * Says the fraction rather than an adjective. "5 of 7 days" is the thing the
 * number is made of, and somebody who disagrees with the score can check it —
 * which an adjective never lets them do.
 */
export function azoraScoreDetail({ daysKept, daysAsked }: AzoraScore): string {
  return `${daysKept} of ${daysAsked} ${daysAsked === 1 ? 'day' : 'days'} kept`;
}

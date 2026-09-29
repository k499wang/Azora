/**
 * One thing the user's own history says about the day they just described.
 *
 * The same findings Profile prints, narrowed to the tags chosen today, so the
 * reply can say something only this person's check-ins could have produced.
 * `factorEffects` decides what counts as a finding; nothing here lowers its
 * bar, and on thin data the reply simply says nothing extra.
 */

import {
  factorEffects,
  type AnalyticsCheckIn,
} from '../../plan/domain/moodAnalytics';
import { withTodaysCheckIn } from './moodCheckIn';

/**
 * The strongest finding among today's tags, as a sentence, or nothing.
 *
 * `recent` is null while the run has not loaded: a line that appears late is
 * better than one computed from today alone, which could never qualify.
 */
export function moodPatternLine(
  recent: readonly AnalyticsCheckIn[] | null,
  today: AnalyticsCheckIn,
): string | null {
  if (recent == null || today.tags.length === 0) return null;

  const effects = factorEffects(withTodaysCheckIn(recent, today));
  if (effects == null) return null;

  const strongest = [...effects.better, ...effects.harder]
    .filter((factor) => today.tags.includes(factor.tagId))
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))[0];
  if (strongest == null) return null;

  return strongest.effect > 0
    ? `You tend to feel better on days tagged ${strongest.label}.`
    : `Days tagged ${strongest.label} tend to be harder for you.`;
}

import type { OnboardingIntent } from '../../components/onboarding/types';
import { lessonForDay } from '../../features/lessons/domain/lessonCatalogue';
import { phoneLessonTrackForIntent } from '../../features/lessons/domain/phoneLessonTrack';
import { pressureLessonTrackForIntent } from '../../features/lessons/domain/pressureLessonTrack';
import { planLessonTitle } from '../../features/plan/domain/planLessonTitle';
import { personalizedPlanJourney } from '../onboardingPlanJourney';
import type { OnboardingPreset } from '../onboardingPreset';
import { FIRST_WEEK_DREAMS, PLAN_OUTLINE_COPY } from './paywallPlanOutlineCopy';

export type PlanOutlineItem =
  | { kind: 'day'; day: number; title: string; line: string }
  | { kind: 'dream'; day: number; outcome: string };

const FIRST_WEEK_DAYS = 7;
/** The plan's milestones, each shown after this many first-week days. */
const DREAM_AFTER_DAYS = [2, 4, 7];
const FIRST_WEEK_DREAM_DAYS = [3, 5, 7];

/** `milestones` looks ahead to the whole plan; `firstWeek` stays inside these seven days. */
export type PlanOutlineDreams = 'milestones' | 'firstWeek';

/** The lessons subscribers will really get, with the plan's own milestones between them. */
export function paywallPlanOutline(
  preset: OnboardingPreset,
  intent: OnboardingIntent,
  goalPhrase: string | null | undefined,
  dreams: PlanOutlineDreams = 'milestones',
): PlanOutlineItem[] {
  const { milestones } = personalizedPlanJourney(preset, intent, null, goalPhrase);
  return Array.from({ length: FIRST_WEEK_DAYS }, (_, index) => index + 1).flatMap((day) => {
    const lesson = lessonForDay(
      preset.id, day, preset.revision,
      pressureLessonTrackForIntent(intent), phoneLessonTrackForIntent(intent),
    );
    if (lesson == null) return [];
    const items: PlanOutlineItem[] = [
      {
        kind: 'day',
        day,
        title: PLAN_OUTLINE_COPY[lesson.id]?.title ?? planLessonTitle(lesson),
        line: PLAN_OUTLINE_COPY[lesson.id]?.line ?? lesson.step,
      },
    ];
    const firstWeekDream = FIRST_WEEK_DREAMS[lesson.id];
    if (dreams === 'firstWeek') {
      if (FIRST_WEEK_DREAM_DAYS.includes(day) && firstWeekDream != null) {
        items.push({ kind: 'dream', day, outcome: firstWeekDream });
      }
      return items;
    }
    const milestone = milestones[DREAM_AFTER_DAYS.indexOf(day)];
    if (DREAM_AFTER_DAYS.includes(day) && milestone != null) {
      items.push({ kind: 'dream', day: milestone.day, outcome: milestone.outcome });
    }
    return items;
  });
}

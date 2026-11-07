import type { OnboardingIntent } from '../../components/onboarding/types';
import { lessonForDay } from '../../features/lessons/domain/lessonCatalogue';
import { phoneLessonTrackForIntent } from '../../features/lessons/domain/phoneLessonTrack';
import { pressureLessonTrackForIntent } from '../../features/lessons/domain/pressureLessonTrack';
import { planLessonTitle } from '../../features/plan/domain/planLessonTitle';
import type { OnboardingPreset } from '../onboardingPreset';
import { FIRST_WEEK_DREAMS, PLAN_OUTLINE_COPY } from './paywallPlanOutlineCopy';

export type PlanOutlineItem =
  | { kind: 'day'; day: number; title: string; line: string }
  | { kind: 'dream'; day: number; outcome: string };

const FIRST_WEEK_DAYS = 7;
const DREAM_DAYS = [3, 5, 7];

/** The lessons subscribers will really get, with what they have by then between them. */
export function paywallPlanOutline(
  preset: OnboardingPreset,
  intent: OnboardingIntent,
): PlanOutlineItem[] {
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
    const dream = FIRST_WEEK_DREAMS[lesson.id];
    if (DREAM_DAYS.includes(day) && dream != null) {
      items.push({ kind: 'dream', day, outcome: dream });
    }
    return items;
  });
}

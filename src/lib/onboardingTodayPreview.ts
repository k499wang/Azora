import type { OnboardingIntent } from '../components/onboarding/types';
import { intentFollowUpsFor } from '../components/onboarding/data/intentFollowUps';
import { lessonForDay } from '../features/lessons/domain/lessonCatalogue';
import { lessonEstimatedMinutes } from '../features/lessons/domain/lessonDuration';
import { pressureLessonTrackForIntent } from '../features/lessons/domain/pressureLessonTrack';
import { phoneLessonTrackForIntent } from '../features/lessons/domain/phoneLessonTrack';
import { latestProgramPreset, programPresetRevision } from '../features/program/domain/programCatalogue';
import type { OnboardingPreset, PresetId } from './onboardingPreset';
import { echoOption } from './onboardingEcho';

export interface OnboardingTodayPreview {
  reason: string;
  lesson: { id: string; title: string; introduction: string; step: string; minutes: number };
  routine: string;
  scopeNote: string | null;
  firstResetDay: number | null;
}

const STARTING_APPROACH: Record<PresetId, string> = {
  home: 'making one everyday space useful',
  night: 'one practical step toward a quieter bedtime',
  morning: 'one manageable step for your morning',
  pressure: 'noticing one difficult moment before choosing a response',
  focus: 'turning one task into a clear next action',
  quiet: 'making room for a small moment of attention',
  phone: 'changing one automatic phone habit',
  recovery: 'a small step that leaves room for rest',
  selfTrust: 'one small commitment you can practise keeping',
};

const ROUTINE: Record<PresetId, string> = {
  home: 'Try the clearing step before a meal, so the space has an immediate use.',
  night: 'Try today’s step as you get ready for bed. Keep it small enough to repeat.',
  morning: 'Try today’s step after getting up, alongside something you already do.',
  pressure: 'Try today’s step during a pause in your day. One everyday moment is enough to practise with.',
  focus: 'Try today’s step when you sit down to work or study, before taking on the whole task.',
  quiet: 'Try today’s step during a familiar pause, such as after a meal.',
  phone: 'Try today’s step before your next work or study task, then return to that one task.',
  recovery: 'Choose a familiar pause for today’s step, and leave room to rest afterward.',
  selfTrust: 'Pair today’s step with something you already do, such as finishing breakfast.',
};

/** Same revision and lesson-track selectors used when enrollment is saved. */
export function buildOnboardingTodayPreview({
  preset, intent, answers, goalPhrase, selectedGoalCount,
}: {
  preset: OnboardingPreset;
  intent: OnboardingIntent;
  answers: Readonly<Record<string, readonly string[] | undefined>>;
  goalPhrase: string | null;
  selectedGoalCount: number;
}): OnboardingTodayPreview {
  const lesson = lessonForDay(
    preset.id, 1, preset.revision,
    pressureLessonTrackForIntent(intent), phoneLessonTrackForIntent(intent),
  );
  if (lesson == null) throw new Error(`Missing first-day lesson for ${preset.id}`);

  const contextQuestion = intentFollowUpsFor(intent)[0];
  const context = echoOption(contextQuestion.options, answers[contextQuestion.id] ?? []);
  const approach = preset.id === 'pressure' && intent === 'calm_fast'
    ? 'noticing a repeated worry and choosing your next activity'
    : STARTING_APPROACH[preset.id];
  let reason = context != null
    ? `Because you told us ${context}, your plan starts with ${approach}.`
    : goalPhrase != null
      ? `Because you want to ${goalPhrase}, your plan starts with ${approach}.`
      : `Your plan starts with ${approach}.`;

  if (intent === 'cleaning') {
    const thought = answers.cleaning_mess_thought;
    const space = answers.cleaning_space_state;
    // A manageable space must not be reframed as an inability to start.
    if (space?.length === 1 && space[0] === 'mostly_clean') {
      reason = 'Because you told us your space mostly needs a little tidying, today starts with keeping one everyday space useful.';
    } else if (thought?.length === 1) {
      const reasons: Record<string, string> = {
        not_bad: 'Because you told us the mess doesn’t feel that bad, today starts with making one everyday space useful.',
        where_start: 'Because you told us you wonder where to start, your plan begins with one usable spot, rather than a whole room.',
        tomorrow: 'Because you told us you tend to leave it until tomorrow, today starts with one small clearing step with a clear stopping point.',
        why_bother: 'Because you told us you wonder why bother when mess returns, today starts with a space you can use for your next meal.',
      };
      reason = reasons[thought[0]] ?? reason;
    }
  }

  const published = preset.revision == null
    ? latestProgramPreset(preset.id, pressureLessonTrackForIntent(intent))
    : programPresetRevision(preset.id, preset.revision);
  return {
    reason,
    lesson: {
      id: lesson.id, title: lesson.title, introduction: lesson.introduction,
      step: lesson.step, minutes: lessonEstimatedMinutes(lesson.blocks),
    },
    routine: preset.id === 'phone' && phoneLessonTrackForIntent(intent) === 'bedtime'
      ? 'Try today’s phone boundary as you get ready for bed, alongside your usual evening routine.'
      : ROUTINE[preset.id],
    scopeNote: selectedGoalCount > 1
      ? 'This is your starting focus. You can keep working on your other goals through your chosen daily to-dos.'
      : null,
    firstResetDay: published?.days.find((day) => day.activityIds.length > 0)?.day ?? null,
  };
}

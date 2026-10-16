/** Weekly learning aims describe the skills taught, without promising outcomes. */

import type { PressureLessonTrack } from '../../lessons/domain/pressureLessonTrack';
import type { PhoneLessonTrack } from '../../lessons/domain/phoneLessonTrack';
import type { ProgramPlanId } from '../../program/domain/programCatalogue';

/** One line per week, in order. Index 0 is week 1. */
const WEEK_COPY: Record<ProgramPlanId, readonly string[]> = {
  night: [
    'Prepare a comfortable sleep setting and a small evening routine, with a gentler response to night waking.',
    'Shape your last hour around a bedtime cue, and notice how caffeine, screens, sound, and alcohol fit your nights.',
    'Connect daytime choices, including light, naps, and meals, with the sleep routine you are building.',
    'Practise returning to your bedtime cues after a rough night, without adding pressure to sleep.',
  ],
  morning: [
    'Choose one manageable morning step and prepare its cue, even when you wake feeling foggy.',
    'Build a morning sequence using light, movement, food, and pauses that fit your energy.',
    'Prepare an easier start and adapt your morning to weekends, basic needs, and the rest you need.',
    'Choose the morning cues you want to keep, with a smaller way to begin after a difficult day.',
  ],
  pressure: [
    'Notice your early pressure cues and practise pausing before choosing a manageable next step.',
    'Name what is building up and make room for a different response.',
    'Separate what you can act on from what needs a limit, a request, or a smaller step.',
    'Practise returning to the present and choosing where to put your effort after an interruption.',
    'Use brief attention pauses and realistic limits when your room to cope is smaller.',
    'Set aside evening demands and choose rest without needing every loose end resolved.',
    'Notice basic needs and choose a response that fits your capacity and the situation.',
    'Review what helped, repair a missed step, and keep a response you can practise again.',
  ],
  focus: [
    'Make one work step clear, give distractions a place, and practise returning your attention to that step.',
    'Work with changes in energy and readiness, then use a clear return point when attention drifts.',
    'Reduce work friction with bounded work periods, quieter prompts, movement, and preparation for tomorrow.',
    'Name what pulls you away and choose a practical work setting, break, or next move.',
    'Support attention with basic needs and breaks, and leave yourself a clear way back to work.',
    'Define enough for the task, adapt the workload, and keep a focus cue you can reuse.',
  ],
  quiet: [
    'Give a brief quiet pause a place in your day, using sound, surroundings, or body sensations as an anchor.',
    'Try several ways to pause and notice feelings without needing to be good at quiet.',
    'Practise noticing thoughts, feelings, and empty moments, then choosing a gentler next move.',
    'Make room before replying and return to quiet through movement, care, and attention.',
    'Choose pauses that leave room for rest and a return, rather than filling every gap.',
    'Reduce small demands, name what you need, and keep a quiet cue that fits your day.',
  ],
  home: [
    'Choose one visible home task, give it a stopping point, and make shared responsibilities clear.',
    'Keep one small surface usable and define enough before starting a tidy.',
    'Use everyday cues to begin one specific home task without turning it into the whole job.',
    'Adapt home care to your capacity and keep one manageable cue for returning.',
  ],
  phone: [
    'Notice the pull to check your phone and choose a practical boundary for one part of your day.',
    'Practise leaving a phone check and returning to what you meant to do.',
    'Give checking a purpose and a stopping point that fit your day.',
    'Review your phone boundaries and keep one you can return to after an unplanned scroll.',
  ],
  recovery: [
    'Check a basic need, choose a pause that fits, and make an easy way back with specific support.',
    'Distinguish useful rest from added demands, and choose a clear stopping point.',
    'Make care easy to begin and small enough for a difficult part of the day.',
    'Lower the load where possible and keep a gentle minimum that respects your capacity.',
  ],
  selfTrust: [
    'Choose one small promise, put its cue where you need it, and adapt it to the day you actually have.',
    'Make the promise specific and easy to begin, with a smaller version and a way back after a miss.',
    'Use a clear cue and fair self-talk to practise returning to the promise without judging one missed step.',
    'Notice what you have done and use new information, feelings, and capacity to adjust your choices.',
    'Protect a little time for care, set a boundary, and give a chosen promise a clear endpoint.',
    'Check capacity before committing and choose the small promise you want to keep practising.',
  ],
};

const PRESSURE_WEEK_COPY: Record<PressureLessonTrack, readonly string[]> = {
  stress: [
    'Notice how stress shows up, pause between demands, and choose what actually needs doing today.',
    'Name the demand, match it to your capacity, and try a gentler next step without added blame.',
    'Limit what you carry, define a task endpoint, and ask clearly for help with one demand.',
    'Practise realistic boundaries and leave a clear way back when work or messages interrupt.',
    'Notice tension and practise returning attention from the task list through brief everyday pauses.',
    'Choose useful rest and give the demanding day an ending, even with tasks left over.',
    'Check basic needs and capacity, then revise a commitment or ask for useful input.',
    'Close the pressure loop, recover a missed step, and keep one useful pause.',
  ],
  overthinking: [
    'Recognise a repeating worry, separate facts from predictions, and choose an available next action.',
    'Notice the repeated story and practise leaving an uncertain question without another check.',
    'Separate practical questions and make one small choice using what you know now.',
    'Begin without complete certainty and choose when enough checking is enough.',
    'Practise attention pauses while letting an unanswered question stay open.',
    'Leave tomorrow a note and practise ending the evening review without solving the night.',
    'Choose rest or movement with loose ends, and fit the decision to your capacity today.',
    'Use a decision for now, address actual mistakes, and keep a response to repeated checking.',
  ],
  anger: [
    'Notice irritation and body cues early, check assumptions, and choose your next words.',
    'Recognise what adds to irritation and name the feeling before choosing a response.',
    'Focus on one solvable problem, ask clearly, and take a break with a plan to return.',
    'Return from replaying an argument and practise a specific repair after a hurtful response.',
    'Check your room to cope and choose a realistic limit, request, or useful break.',
    'Notice tired evening patterns and give a dispute or reply a stopping place for the night.',
    'Use a pause, movement, and conversation timing to make room before the next response.',
    'State the need, repair a specific reply, and keep practising the patient response.',
  ],
};

const PRESSURE_COURSE_WEEK_COPY = {
  stress: [
    'Notice your stress pattern and choose a practical first response.',
    'Notice body signals, take useful breaks, and check stressful thoughts.',
    'Choose priorities, plan small actions, and ask for realistic limits or help.',
    'Prepare for rest, review useful tools, and plan for difficult days.',
  ],
  overthinking: [
    'Recognise repeated thinking and choose one useful response.',
    'Practise returning attention and distinguish preparation from repeated worry.',
    'Separate practical problems, check guesses, and choose clear next actions.',
    'Practise choices with uncertainty and keep a plan for worries that return.',
  ],
} as const;

const PHONE_WEEK_COPY: Record<PhoneLessonTrack, readonly string[]> = {
  bedtime: [
    'Notice what draws you to your phone as bedtime approaches.',
    'Give the phone a stopping place and choose a quieter way to wind down.',
    'Practise leaving a late scroll and returning to your bedtime routine.',
    'Keep a small bedtime boundary you can return to after a difficult night.',
  ],
  work: [
    'Notice when a work task sends your hand toward your phone.',
    'Put the phone aside and make the next work step easy to begin.',
    'Practise returning to your task after a message or an unplanned scroll.',
    'Keep a workable phone boundary through busy days and interrupted tasks.',
  ],
};

export function planWeekPurpose(
  planId: ProgramPlanId,
  week: number,
  phoneLessonTrack?: PhoneLessonTrack,
  pressureLessonTrack?: PressureLessonTrack,
  presetRevision?: number,
): string | null {
  return planWeekPurposeLines(planId, phoneLessonTrack, pressureLessonTrack, presetRevision)[week - 1] ?? null;
}

/** Every authored week of a plan, for the tests that audit the whole table. */
export function planWeekPurposeLines(
  planId: ProgramPlanId,
  phoneLessonTrack?: PhoneLessonTrack,
  pressureLessonTrack?: PressureLessonTrack,
  presetRevision?: number,
): readonly string[] {
  if (planId === 'pressure') {
    const track = pressureLessonTrack ?? 'stress';
    if (track !== 'anger' && (presetRevision == null || presetRevision >= 13)) {
      return PRESSURE_COURSE_WEEK_COPY[track];
    }
    return PRESSURE_WEEK_COPY[track];
  }
  return planId === 'phone' && phoneLessonTrack != null
    ? PHONE_WEEK_COPY[phoneLessonTrack]
    : WEEK_COPY[planId] ?? [];
}

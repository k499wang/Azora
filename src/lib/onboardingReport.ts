import { SHORT_RESET_PLAN_PURPOSE } from '../features/program/domain/programResetPurpose';
import {
  latestProgramPreset,
  programPlanShape,
  programPresetWeeks,
} from '../features/program/domain/programCatalogue';
import { joinClauses } from './onboardingLoad';
import type { PresetId } from './onboardingPreset';

/** Authored clauses from answers the user actually selected. */
export interface OnboardingReportAnswers {
  contextEcho: string | null;
  routineEcho: string | null;
  obstacleEcho: string | null;
  goalPhrase: string | null;
  sleepEcho: string | null;
  energyEcho: string | null;
  focusEcho: string | null;
  stressEcho: string | null;
}

export interface ReportAnswerSummaryItem {
  id: 'goal' | 'routine' | 'rest' | 'focus' | 'starting';
  label: string;
  value: string;
}

const PLAN_PURPOSE: Record<PresetId, string> = {
  ...SHORT_RESET_PLAN_PURPOSE,
  night: 'A short guided reset gives you a routine to practise as you wind down.',
  pressure: 'Guided breathing and daily lessons give you a pause to practise before responding to stress.',
};

const PLAN_SUPPORT: Record<PresetId, string> = {
  night: 'Guided practices give you one clear thing to focus on as you wind down.',
  morning: 'Guided instructions give you one small practice to follow before the day gets going.',
  focus: 'Guided pauses give you one thing to practise before starting a work or study task.',
  home: 'Guided instructions give you one small practice to follow before taking on a household task.',
  phone: 'Guided pauses let you practise noticing an urge before deciding what to do next.',
  pressure: 'Guided exercises and lessons give you a clear way to practise pausing when stress shows up.',
  recovery: 'Gentle guided practices can be done from a comfortable position.',
  selfTrust: 'Guided instructions give you a small action to follow through on without a perfect result.',
  quiet: 'Guided attention practices give you one thing to notice at a time.',
};

interface PlanPracticeTip {
  action: string;
  why: string;
}

const PLAN_PRACTICE_TIP: Record<PresetId, PlanPracticeTip> = {
  night: {
    action: 'Before bed, write down one task for tomorrow. Leave the note somewhere you’ll see it in the morning.',
    why: 'Give tomorrow’s task a place outside your head.',
  },
  morning: {
    action: 'Tonight, set out one thing you’ll need in the morning: a cup, your clothes or your bag.',
    why: 'Make your first morning step easier to begin.',
  },
  focus: {
    action: 'Write the next physical action for one task, such as “open the document.” Give just that action two minutes.',
    why: 'A clear starting point is easier to act on than a whole project.',
  },
  home: {
    action: 'Pick one small spot and put away three things. You can stop there.',
    why: 'A small, visible win gives you a finish line without taking on the whole room.',
  },
  phone: {
    action: 'Put your phone out of reach for five minutes while you do one thing you chose.',
    why: 'Create a little space between the urge to scroll and your next choice.',
  },
  pressure: {
    action: 'Before your next reply or decision, pause and name the one thing you need to do next.',
    why: 'Choose one response instead of taking on everything at once.',
  },
  recovery: {
    action: 'From a comfortable place, choose one tiny task that fits your energy today. Make stopping an option.',
    why: 'A small step can count without pushing past your limits.',
  },
  selfTrust: {
    action: 'Choose one promise small enough to keep today, such as putting one item away. Notice when you’ve kept it.',
    why: 'Give yourself a concrete example of following through.',
  },
  quiet: {
    action: 'Pause where you are and notice three things around you: a colour, a sound and a texture.',
    why: 'Give your attention one simple place to land.',
  },
};

export function buildOnboardingReport(
  planId: PresetId,
  answers: OnboardingReportAnswers,
): {
  summary: readonly ReportAnswerSummaryItem[];
  fitLines: readonly string[];
  planFacts: { weeks: number; firstDayMinutes: number };
  practiceTip: PlanPracticeTip;
  reassurance: string;
} {
  const publishedPlan = latestProgramPreset(planId);
  if (publishedPlan == null) {
    throw new Error(`No published program plan for ${planId}`);
  }
  const summary: ReportAnswerSummaryItem[] = [];
  const seen = new Set<string>();
  const addSummary = (
    id: ReportAnswerSummaryItem['id'],
    label: string,
    clauses: readonly (string | null)[],
  ) => {
    const value = joinClauses(clauses.filter((clause) => {
      if (clause == null || seen.has(clause)) return false;
      seen.add(clause);
      return true;
    }));
    if (value != null) summary.push({ id, label, value });
  };

  const categorizedEchoes = new Set([
    answers.sleepEcho, answers.energyEcho, answers.focusEcho, answers.stressEcho,
  ]);
  addSummary('goal', 'Your priority', [answers.goalPhrase]);
  addSummary('routine', 'Daily life', [answers.contextEcho, answers.routineEcho]
    .filter((clause) => !categorizedEchoes.has(clause)));
  addSummary('rest', 'Rest & energy', [answers.sleepEcho, answers.energyEcho]);
  addSummary('focus', 'Focus & stress', [answers.focusEcho, answers.stressEcho]);
  addSummary('starting', 'What makes starting hard', [answers.obstacleEcho]);

  const goal = answers.goalPhrase == null
    ? ''
    : `Your priority is to ${answers.goalPhrase}. `;
  const relevantEcho = {
    night: answers.sleepEcho,
    morning: answers.energyEcho,
    focus: answers.focusEcho,
    home: null,
    phone: null,
    pressure: answers.stressEcho,
    recovery: answers.energyEcho,
    selfTrust: null,
    quiet: null,
  }[planId];
  const context = joinClauses([
    answers.contextEcho ?? relevantEcho ?? answers.routineEcho,
  ]);

  return {
    summary,
    fitLines: [
      `${goal}${PLAN_PURPOSE[planId]}`,
      `${context == null ? '' : `${context} `}${PLAN_SUPPORT[planId]}`,
    ],
    planFacts: {
      weeks: programPresetWeeks(publishedPlan),
      firstDayMinutes: programPlanShape(publishedPlan).firstDayMinutes,
    },
    practiceTip: PLAN_PRACTICE_TIP[planId],
    reassurance: 'Miss a day? Pick up where you left off. No catching up.',
  };
}

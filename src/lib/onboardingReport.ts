import { SHORT_RESET_PLAN_PURPOSE } from '../features/program/domain/programResetPurpose';
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

export function buildOnboardingReport(
  planId: PresetId,
  answers: OnboardingReportAnswers,
): {
  summary: readonly ReportAnswerSummaryItem[];
  fitLines: readonly string[];
  reassurance: string;
} {
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
    reassurance: 'Miss a day? Pick up where you left off. No catching up.',
  };
}

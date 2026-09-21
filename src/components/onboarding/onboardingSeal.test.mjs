import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./OnboardingFlow.tsx', import.meta.url), 'utf8');
const sealSource = source.slice(
  source.indexOf('  const saveProfileAndSeal = async () => {'),
  source.indexOf('\n  const finish = async'),
);

function sealHarness(saveGoals) {
  const events = [];
  const drafts = [{ title: 'My selected task' }];
  const noop = () => {};
  const mutation = { mutateAsync: async () => {} };
  const dependencies = {
    isSubmitting: false,
    sealInFlightRef: { current: false },
    buildOnboardingResult: () => ({ displayName: 'Test' }),
    setIsSubmitting: noop,
    setErrorMessage: (error) => { if (error) events.push(['error', error]); },
    userId: 'user',
    selectedIntents: [],
    trackOnboardingProfileSaveStarted: noop,
    getStepEventInput: () => ({}),
    buildProfileAnalyticsProperties: () => ({}),
    buildDailyPlanSchedule: noop,
    slotTimes: {},
    buildGrowthAreaSevenDayExercisePlanV2: noop,
    planMindMap: { growthArea: { axis: 'focus' } },
    formatLocalDate: () => '2026-09-20',
    onSaveProfile: async () => {},
    updateDailyPlanSchedule: mutation,
    updateDailyPlanExercises: mutation,
    startProgramEnrollment: async () => ({}),
    onboardingPresetFor: () => ({ id: 'plan' }),
    plan: { intent: 'focus' },
    PROGRAM_PRESET_REVISION: 1,
    getProgramEnrollmentQueryKey: noop,
    queryClient: { cancelQueries: async () => {}, setQueryData: noop },
    createSelfCareGoals: { mutateAsync: async (input) => {
      assert.equal(input, drafts);
      events.push(['save']);
      await saveGoals();
    } },
    starterPlanDraftList: () => drafts,
    setTimeout: (callback) => callback(),
    resetTodayJourneyOrderAfterOnboarding: async () => { events.push(['order']); },
    trackOnboardingProfileSaveSucceeded: noop,
    trackOnboardingRegistrationCompleted: noop,
    goToStep: (step) => { events.push(['step', step]); },
    trackOnboardingProfileSaveFailed: noop,
    getErrorMessage: (error) => error.message,
    buildOnboardingSaveFailureDiagnostics: async () => ({}),
    console: { log: noop, warn: noop },
  };
  const js = ts.transpileModule(`${sealSource}\nreturn saveProfileAndSeal;`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const seal = new Function(...Object.keys(dependencies), js)(...Object.values(dependencies));
  return { seal, events };
}

test('a failed starter save stays on the pact and can be retried', async () => {
  let fail = true;
  const { seal, events } = sealHarness(async () => {
    if (fail) throw new Error('Connection failed');
  });
  await seal();
  assert.deepEqual(events, [['save'], ['error', 'Connection failed']]);
  fail = false;
  await seal();
  assert.deepEqual(events.slice(2), [['save'], ['order'], ['step', 'paywall']]);
});

test('rapid confirmations save once and advance only after the tasks finish', async () => {
  let release;
  const saving = new Promise((resolve) => { release = resolve; });
  const { seal, events } = sealHarness(() => saving);
  const first = seal();
  await seal();
  await Promise.resolve();
  assert.deepEqual(events, [['save']]);
  release();
  await first;
  assert.deepEqual(events, [['save'], ['order'], ['step', 'paywall']]);
});

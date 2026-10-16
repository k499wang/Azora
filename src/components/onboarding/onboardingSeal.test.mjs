import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { pressureLessonTrackForIntent } from '../../features/lessons/domain/pressureLessonTrack.ts';
import { hasRecoverableOnboardingProfile } from '../../services/profile/onboardingProfileRecovery.ts';

const source = readFileSync(new URL('./OnboardingFlow.tsx', import.meta.url), 'utf8');
const sealSource = source.slice(
  source.indexOf('  const saveProfileAndSeal = async () => {'),
  source.indexOf('\n  const finish = async'),
);

function sealHarness(actions = {}) {
  const events = [];
  const drafts = [{ title: 'My selected task' }];
  const profileRow = { onboarding_goal: null };
  const noop = () => {};
  const run = async (action) => {
    events.push([action]);
    await actions[action]?.();
  };
  const dependencies = {
    isSubmitting: false,
    sealInFlightRef: { current: false },
    buildOnboardingResult: () => ({ displayName: 'Test', onboardingGoal: 'Stress relief' }),
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
    onSaveProfile: async (result) => {
      await run('profile');
      profileRow.onboarding_goal = result.onboardingGoal;
    },
    updateDailyPlanSchedule: { mutateAsync: () => run('schedule') },
    updateDailyPlanExercises: { mutateAsync: () => run('exercises') },
    startProgramEnrollment: async () => {
      await actions.enrollment?.();
      return {};
    },
    pressureLessonTrackForIntent,
    onboardingPresetFor: () => ({ id: 'plan' }),
    plan: { intent: 'focus' },
    intentFollowUpAnswers: {},
    activeContext: { sleepCause: null },
    getProgramEnrollmentQueryKey: noop,
    queryClient: { cancelQueries: async () => {}, setQueryData: noop },
    createSelfCareGoals: { mutateAsync: async (input) => {
      assert.equal(input, drafts);
      await run('tasks');
    } },
    starterPlanDraftList: () => drafts,
    celebrationFinishedRef: { set current(finish) {
      if (actions.celebration) actions.celebration(finish);
      else finish();
    } },
    resetTodayJourneyOrderAfterOnboarding: () => run('order'),
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
  return { seal, events, profileRow };
}

const successfulEvents = [
  ['tasks'], ['schedule'], ['exercises'], ['order'], ['profile'], ['step', 'paywall'],
];

for (const action of ['tasks', 'schedule', 'exercises', 'order', 'profile']) {
  test(`a failed ${action} save stays on the pact and can be retried`, async () => {
    let fail = true;
    const { seal, events } = sealHarness({ [action]: async () => {
      if (fail) throw new Error('Connection failed');
    } });
    await seal();
    assert.deepEqual(events.at(-1), ['error', 'We couldn’t save your plan. Tap the seal to try again.']);
    assert.equal(events.some(([event]) => event === 'step'), false);
    assert.equal(events.filter(([event]) => event === 'profile').length, action === 'profile' ? 1 : 0);
    const failedAttemptEventCount = events.length;
    fail = false;
    await seal();
    assert.deepEqual(events.slice(failedAttemptEventCount), successfulEvents);
  });
}

test('rapid confirmations save once and advance only after the tasks finish', async () => {
  let release;
  const saving = new Promise((resolve) => { release = resolve; });
  const { seal, events } = sealHarness({ tasks: () => saving });
  const first = seal();
  await seal();
  await Promise.resolve();
  assert.deepEqual(events, [['tasks']]);
  release();
  await first;
  assert.deepEqual(events, successfulEvents);
});

test('required writes run during the celebration and advance after it finishes', async () => {
  let finishCelebration;
  let profileSaved;
  const saved = new Promise((resolve) => { profileSaved = resolve; });
  const { seal, events } = sealHarness({
    profile: profileSaved,
    celebration: (finish) => { finishCelebration = finish; },
  });
  const sealing = seal();
  await saved;
  assert.deepEqual(events, successfulEvents.slice(0, -1));
  finishCelebration();
  await sealing;
  assert.deepEqual(events, successfulEvents);
});

test('optional enrollment failure preserves the required saves and paywall transition', async () => {
  const { seal, events } = sealHarness({
    enrollment: async () => { throw new Error('Enrollment unavailable'); },
  });
  await seal();
  assert.deepEqual(events, successfulEvents);
});

test('a failed settings write cannot make a restarted flow skip its missing plan', async () => {
  let fail = true;
  const { seal, profileRow } = sealHarness({
    schedule: async () => { if (fail) throw new Error('Connection failed'); },
  });
  await seal();
  assert.equal(hasRecoverableOnboardingProfile(profileRow), false);
  fail = false;
  await seal();
  assert.equal(hasRecoverableOnboardingProfile(profileRow), true);
});

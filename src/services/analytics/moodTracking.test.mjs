import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { AnalyticsEvent } from './events.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./tracking.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function harness() {
  const calls = [];
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === './events') return { AnalyticsEvent };
      if (name === '../../config/posthog') {
        return { posthog: { capture: (event, properties) => {
          calls.push(structuredClone({ event, properties }));
        } } };
      }
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  assert.deepEqual(calls, []);
  return { tracking: exports, calls };
}

// Extra runtime fields must never be spread into an event, even if a caller
// passes a check-in object containing more than the wrapper's typed props.
const privateFields = {
  answers: { overall: 1, energy: 2, sleep: 3 },
  raw_answers: { overall: 1 },
  score: 17,
  note: 'PRIVATE JOURNAL SENTINEL',
  tags: ['PRIVATE TAG SENTINEL'],
  localDate: '2026-10-19',
};

const cases = [
  ['trackMoodCheckInOpened', 'mood_check_in_opened',
    { source: 'plan' }, { source: 'plan' }],
  ['trackMoodCheckInCompleted', 'mood_check_in_completed',
    { band: 'low', questionCount: 1, isRevision: false, tagCount: 2, feeling: 'tired', feelingSet: 'low' },
    { band: 'low', question_count: 1, is_revision: false, tag_count: 2, feeling: 'tired', feeling_set: 'low' }],
  ['trackMoodSuggestionOffered', 'mood_suggestion_offered',
    { answering: 'tired', actionIds: ['rest', 'walk', 'stretch'] },
    { answering: 'tired', action_ids: ['rest', 'walk', 'stretch'] }],
  ['trackMoodSuggestionAccepted', 'mood_suggestion_accepted',
    { answering: 'tired', actionIds: ['walk'] },
    { answering: 'tired', action_ids: ['walk'] }],
  ['trackMoodSuggestionDeclined', 'mood_suggestion_declined',
    { answering: 'low', actionIds: ['rest', 'walk', 'stretch'] },
    { answering: 'low', action_ids: ['rest', 'walk', 'stretch'] }],
  ['trackMoodInsightsViewed', 'mood_insights_viewed',
    { cards: ['trend', 'reasons', 'feelings'], checkInDays: 23 },
    { cards: ['trend', 'reasons', 'feelings'], check_in_days: 23 }],
  ['trackMoodSupportLinkShown', 'mood_support_link_shown',
    { reason: 'hopeless' }, { reason: 'hopeless' }],
  ['trackMoodSupportLinkTapped', 'mood_support_link_tapped',
    { reason: 'hard-run' }, { reason: 'hard-run' }],
];

for (const [wrapper, event, input, properties] of cases) {
  test(`${wrapper} captures only its allowed snake_case properties and context`, () => {
    const { tracking, calls } = harness();
    tracking[wrapper]({ ...input, ...privateFields });
    assert.deepEqual(calls, [{ event, properties }]);
  });
}

test('completion preserves revisions, zero tags and explicit null feeling context', () => {
  const { tracking, calls } = harness();
  tracking.trackMoodCheckInCompleted({
    ...privateFields,
    band: 'middling', questionCount: 3, isRevision: true, tagCount: 0,
    feeling: null, feelingSet: null,
  });
  assert.deepEqual(calls, [{
    event: 'mood_check_in_completed',
    properties: {
      band: 'middling', question_count: 3, is_revision: true, tag_count: 0,
      feeling: null, feeling_set: null,
    },
  }]);
});

test('insights preserves an empty section list and zero check-in days', () => {
  const { tracking, calls } = harness();
  tracking.trackMoodInsightsViewed({ cards: [], checkInDays: 0, ...privateFields });
  assert.deepEqual(calls, [{
    event: 'mood_insights_viewed', properties: { cards: [], check_in_days: 0 },
  }]);
});

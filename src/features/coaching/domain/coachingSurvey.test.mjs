import assert from 'node:assert/strict';
import test from 'node:test';
import { isCoachingSurveyComplete } from './coachingSurvey.ts';

const complete = {
  helpWith: 'Sleep',
  differentIn30Days: 'In bed by eleven',
  triedAndObstacles: 'Alarms; I ignore them',
  importance: 4,
  comfortablePaying: 'no',
  name: 'Sam',
  email: 'sam@example.com',
  timeZone: 'America/New_York',
  agreedToShare: true,
};

test('every answer and the agreement make it complete, whatever the payment answer', () => {
  assert.equal(isCoachingSurveyComplete(complete), true);
});

test('a blank, unanswered, or unagreed field keeps it incomplete', () => {
  for (const missing of [
    { helpWith: '   ' },
    { differentIn30Days: '' },
    { triedAndObstacles: '' },
    { importance: null },
    { comfortablePaying: null },
    { name: ' ' },
    { timeZone: '' },
    { agreedToShare: false },
  ]) {
    assert.equal(isCoachingSurveyComplete({ ...complete, ...missing }), false);
  }
});

test('an email needs a mailbox and a domain', () => {
  assert.equal(isCoachingSurveyComplete({ ...complete, email: 'sam' }), false);
  assert.equal(isCoachingSurveyComplete({ ...complete, email: ' sam@example.com ' }), true);
});

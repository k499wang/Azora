import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLAN_RESERVATION_MS,
  formatCountdown,
  paywallHighlights,
  paywallPlanFacts,
  planReservationRemaining,
} from './paywallLongForm.ts';

const EVERY_INTENT = [
  'stress_relief', 'calm_fast', 'sleep', 'focus', 'energy', 'self_acceptance',
  'emotional_balance', 'self_care', 'spiritual', 'yoga', 'heart_health',
  'daily_habit', 'other',
];

test('every goal resolves to a real plan the paywall can name', () => {
  for (const intent of EVERY_INTENT) {
    const facts = paywallPlanFacts(intent, 5);
    assert.ok(facts.planName.length > 0, intent);
    assert.ok(facts.planDays > 0 && facts.planDays % 7 === 0, intent);
    assert.equal(facts.sessionMinutes, 5);
    assert.doesNotMatch(facts.planName, /breathwork|exercise/i);
  }
});

test('the bullets lead with the goal they chose, then the plan they get', () => {
  const seen = new Set();
  for (const intent of EVERY_INTENT) {
    const facts = paywallPlanFacts(intent, 4);
    const highlights = paywallHighlights(intent, facts);

    assert.equal(highlights.length, 7, intent);
    for (const highlight of highlights) {
      assert.ok(highlight.icon.length > 0, intent);
      assert.ok(highlight.text.length > 0, intent);
      assert.doesNotMatch(highlight.text, /breathwork|exercise/i, highlight.text);
    }
    assert.match(highlights[2].text, new RegExp(String(facts.planDays)));
    assert.match(highlights[2].text, new RegExp(facts.planName));
    assert.match(highlights[3].text, /4-minute reset/);
    seen.add(highlights[0].text);
  }
  assert.equal(seen.size, EVERY_INTENT.length);
});

test('the reservation counts down from fifteen minutes and stops at zero', () => {
  const started = 1_000_000;
  assert.equal(planReservationRemaining(started, started), PLAN_RESERVATION_MS);
  assert.equal(
    planReservationRemaining(started, started + 60_000),
    14 * 60 * 1000,
  );
  assert.equal(planReservationRemaining(started, started + PLAN_RESERVATION_MS), 0);
  // A device that slept through the whole window comes back at zero, never
  // negative and never showing time it does not have.
  assert.equal(planReservationRemaining(started, started + 60 * 60 * 1000), 0);
});

test('the countdown reads as a clock', () => {
  assert.equal(formatCountdown(PLAN_RESERVATION_MS), '15:00');
  assert.equal(formatCountdown(14 * 60 * 1000 + 59_000), '14:59');
  assert.equal(formatCountdown(9_400), '0:10');
  assert.equal(formatCountdown(0), '0:00');
});

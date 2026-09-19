import assert from 'node:assert/strict';
import test from 'node:test';
import { planChoices } from './planChoices';
import { allProgramPresets } from '../../program/domain/programCatalogue';

test('every published plan is offered, and nothing else is', () => {
  const offered = planChoices().map((choice) => choice.planId);
  const published = allProgramPresets().map((preset) => preset.planId);

  assert.deepEqual(offered, published);
});

test('each choice can be told apart without reading the plan name', () => {
  const choices = planChoices();
  const territories = choices.map((choice) => choice.territory);

  assert.equal(new Set(territories).size, choices.length);
  for (const choice of choices) {
    assert.ok(choice.territory.length > 0, `${choice.planId} has no territory`);
    assert.ok(choice.outcome.length > 0, `${choice.planId} has no outcome`);
    assert.ok(choice.weeks > 0, `${choice.planId} has no length`);
  }
});

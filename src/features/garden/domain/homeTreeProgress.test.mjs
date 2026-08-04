import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HOME_TREE_STAGE_DEFINITIONS,
  buildHomeTreeProgress,
} from './homeTreeProgress.ts';

test('uses the seed stage before the first care day', () => {
  assert.deepEqual(buildHomeTreeProgress(0), {
    careDays: 0,
    stage: 'seed',
    stageLabel: 'Seed',
    stageStartsAtCareDays: 0,
    nextStage: 'sprout',
    nextStageLabel: 'Sprout',
    nextStageStartsAtCareDays: 1,
    careDaysUntilNextStage: 1,
    stageProgress: 0,
  });
});

test('advances at each exact care-day threshold', () => {
  const expectedStages = [
    [0, 'seed'],
    [1, 'sprout'],
    [4, 'sapling'],
    [14, 'young'],
    [30, 'mature'],
  ];

  expectedStages.forEach(([careDays, stage]) => {
    assert.equal(buildHomeTreeProgress(careDays).stage, stage);
  });
});

test('reports progress and remaining care days within a stage', () => {
  const progress = buildHomeTreeProgress(9);

  assert.equal(progress.stage, 'sapling');
  assert.equal(progress.nextStage, 'young');
  assert.equal(progress.careDaysUntilNextStage, 5);
  assert.equal(progress.stageProgress, 0.5);
});

test('keeps the mature stage stable after the final threshold', () => {
  const progress = buildHomeTreeProgress(120);

  assert.equal(progress.stage, 'mature');
  assert.equal(progress.nextStage, null);
  assert.equal(progress.nextStageStartsAtCareDays, null);
  assert.equal(progress.careDaysUntilNextStage, 0);
  assert.equal(progress.stageProgress, 1);
});

test('normalizes invalid, negative, and fractional care-day counts', () => {
  assert.equal(buildHomeTreeProgress(Number.NaN).careDays, 0);
  assert.equal(buildHomeTreeProgress(Number.POSITIVE_INFINITY).careDays, 0);
  assert.equal(buildHomeTreeProgress(-3).careDays, 0);
  assert.equal(buildHomeTreeProgress(4.9).careDays, 4);
});

test('keeps stage definitions ordered and starting at zero', () => {
  assert.equal(HOME_TREE_STAGE_DEFINITIONS[0].startsAtCareDays, 0);

  for (let index = 1; index < HOME_TREE_STAGE_DEFINITIONS.length; index += 1) {
    assert.ok(
      HOME_TREE_STAGE_DEFINITIONS[index].startsAtCareDays >
        HOME_TREE_STAGE_DEFINITIONS[index - 1].startsAtCareDays,
    );
  }
});

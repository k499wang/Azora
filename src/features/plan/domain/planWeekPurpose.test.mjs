import { test } from 'node:test';
import assert from 'node:assert/strict';

import { planWeekPurpose, planWeekPurposeLines } from './planWeekPurpose.ts';
import {
  latestProgramPreset,
  programPresetWeeks,
} from '../../program/domain/programCatalogue.ts';

const PLAN_IDS = ['night', 'morning', 'pressure', 'focus', 'quiet', 'home', 'phone', 'recovery', 'selfTrust'];

const weeksIn = (planId) => programPresetWeeks(latestProgramPreset(planId));

/** The table drifting out of step with the catalogue is what this catches. */
test('a plan authors exactly one line for each of its weeks', () => {
  for (const planId of PLAN_IDS) {
    assert.equal(planWeekPurposeLines(planId).length, weeksIn(planId), planId);
  }
});

test('every week of every plan gets a line that ends in a stop', () => {
  for (const planId of PLAN_IDS) {
    for (let week = 1; week <= weeksIn(planId); week += 1) {
      const line = planWeekPurpose(planId, week);
      assert.ok(line != null && line.length > 0, `${planId} week ${week}`);
      assert.match(line, /\.$/, `${planId} week ${week}`);
    }
  }
});

test('a week is written for a glance, not a paragraph', () => {
  for (const planId of PLAN_IDS) {
    for (const line of planWeekPurposeLines(planId)) {
      const sentences = line.match(/[.!?](\s|$)/g) ?? [];
      assert.ok(sentences.length <= 2, `${planId}: ${line}`);
    }
  }
});

/** The house style forbids it, and it creeps back in through copy edits. */
test('no line carries an em dash', () => {
  for (const planId of PLAN_IDS) {
    for (const line of planWeekPurposeLines(planId)) {
      assert.doesNotMatch(line, /\u2014/, `${planId}: ${line}`);
    }
  }
});

test('the copy never names a date or a weekday', () => {
  for (const planId of PLAN_IDS) {
    for (const line of planWeekPurposeLines(planId)) {
      assert.doesNotMatch(
        line,
        /monday|tuesday|jan|feb|mar/i,
        `${planId}: ${line}`,
      );
    }
  }
});

test('banned words stay out of the plan copy', () => {
  for (const planId of PLAN_IDS) {
    for (const line of planWeekPurposeLines(planId)) {
      assert.doesNotMatch(line, /breathwork/i, `${planId}: ${line}`);
    }
  }
});

test('no two weeks of a plan say the same thing', () => {
  for (const planId of PLAN_IDS) {
    const lines = planWeekPurposeLines(planId);
    assert.equal(new Set(lines).size, lines.length, planId);
  }
});

test('a week reads for its own plan, not for every plan at once', () => {
  const night = planWeekPurposeLines('night');
  const focus = planWeekPurposeLines('focus');
  for (let index = 0; index < Math.min(night.length, focus.length); index += 1) {
    assert.notEqual(night[index], focus[index], `week ${index + 1}`);
  }
});

test('a week outside the plan has no copy rather than the wrong copy', () => {
  assert.equal(planWeekPurpose('night', 0), null);
  assert.equal(planWeekPurpose('night', weeksIn('night') + 1), null);
});

test('phone week copy follows the enrolled bedtime or work track', () => {
  for (const track of ['bedtime', 'work']) {
    const lines = planWeekPurposeLines('phone', track);
    assert.equal(lines.length, weeksIn('phone'));
    assert.equal(new Set(lines).size, lines.length);
    for (const [index, line] of lines.entries()) {
      assert.equal(planWeekPurpose('phone', index + 1, track), line);
      assert.match(line, track === 'bedtime' ? /bedtime|wind down/ : /work|task/);
      if (track === 'work') assert.doesNotMatch(line, /bedtime|night|sleep/);
      assert.notEqual(line, planWeekPurpose('phone', index + 1));
    }
  }
  assert.equal(planWeekPurpose('phone', 5, 'work'), null);
  assert.equal(planWeekPurpose('night', 1, 'work'), planWeekPurpose('night', 1));
});


test('weekly aims teach usable skills without promising symptom control', () => {
  const allLines = [
    ...PLAN_IDS.flatMap((planId) => planWeekPurposeLines(planId)),
    ...['stress', 'overthinking', 'anger'].flatMap((track) => planWeekPurposeLines('pressure', undefined, track)),
    ...['bedtime', 'work'].flatMap((track) => planWeekPurposeLines('phone', track)),
  ];
  for (const line of allLines) {
    assert.doesNotMatch(line, /you should|on command|at will|sleep through|within minutes|every day awake/i);
    assert.match(line, /notice|choose|prepare|practise|build|shape|connect|return|reduce|make|give|try|use|check|name|limit|separate|begin|leave|set|review|define|support|adapt|protect|distinguish|lower|recognise|focus|state|keep/i);
  }
  assert.match(planWeekPurpose('selfTrust', 1), /small promise.*cue.*adapt/i);
});

test('pressure weekly guidance is distinct for each enrolled learning goal', () => {
  const tracks = ['stress', 'overthinking', 'anger'];
  for (const track of tracks) {
    const lines = planWeekPurposeLines('pressure', undefined, track);
    assert.equal(lines.length, weeksIn('pressure'));
    assert.equal(new Set(lines).size, lines.length);
    lines.forEach((line, index) => assert.equal(planWeekPurpose('pressure', index + 1, undefined, track), line));
  }
  for (let week = 1; week <= weeksIn('pressure'); week += 1) {
    assert.equal(new Set(tracks.map((track) => planWeekPurpose('pressure', week, undefined, track))).size, 3);
  }
  assert.equal(planWeekPurpose('pressure', 9, undefined, 'stress'), null);
  assert.equal(planWeekPurpose('night', 1, undefined, 'anger'), planWeekPurpose('night', 1));
});

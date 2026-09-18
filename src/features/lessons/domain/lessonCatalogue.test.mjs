/**
 * The lessons, held to the format they were specified in.
 *
 * Content this size drifts: a lesson written in a hurry runs long, forgets its
 * instruction, or invents a number to fill the card. None of that shows up on a
 * device until somebody reads all twenty-six, so it is checked here instead.
 *
 * Format rules are from `docs/plans/lesson-catalogue-plan.md`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allLessons,
  lessonById,
  lessonForDay,
  LESSON_SEQUENCES,
} from './lessonCatalogue.ts';
import { latestProgramPreset } from '../../program/domain/programCatalogue.ts';

/** The plan's length in days. `days` is contiguous from 1. */
function planLength(planId) {
  return latestProgramPreset(planId).days.length;
}

const PLAN_IDS = ['night', 'morning', 'pressure', 'focus', 'quiet'];

function prose(lesson) {
  return lesson.blocks
    .flatMap((block) => {
      if (block.kind === 'text' || block.kind === 'do') return [block.text];
      if (block.kind === 'list') {
        return block.items.flatMap((item) => [item.term, item.text]);
      }
      return [block.value, block.caption];
    })
    .join(' ');
}

function wordCount(lesson) {
  return prose(lesson).replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;
}

test('a lesson is four to six blocks, never one wall of prose', () => {
  for (const lesson of allLessons()) {
    assert.ok(
      lesson.blocks.length >= 4 && lesson.blocks.length <= 6,
      `${lesson.id} has ${lesson.blocks.length} blocks`,
    );
  }
});

test('every lesson ends on something to do, and only there', () => {
  for (const lesson of allLessons()) {
    const dos = lesson.blocks.filter((block) => block.kind === 'do');
    assert.equal(dos.length, 1, `${lesson.id}`);
    assert.equal(
      lesson.blocks[lesson.blocks.length - 1].kind,
      'do',
      `${lesson.id} does not end on its instruction`,
    );
  }
});

test('a lesson is one screen and a half, not an article', () => {
  for (const lesson of allLessons()) {
    const words = wordCount(lesson);
    assert.ok(words <= 150, `${lesson.id} runs to ${words} words`);
    assert.ok(words >= 60, `${lesson.id} is only ${words} words`);
  }
});

test('at most one number per lesson, and none invented to fill the card', () => {
  for (const lesson of allLessons()) {
    const facts = lesson.blocks.filter((block) => block.kind === 'fact');
    assert.ok(facts.length <= 1, `${lesson.id} has ${facts.length} facts`);
    for (const fact of facts) {
      assert.match(
        fact.value,
        /\d/,
        `${lesson.id}'s fact has no number in it — it is a phrase in a number's clothes`,
      );
      assert.ok(fact.caption.length > 0);
    }
  }
});

test('every paragraph carries a skim path, and no paragraph is a wall', () => {
  for (const lesson of allLessons()) {
    for (const block of lesson.blocks) {
      if (block.kind !== 'text' && block.kind !== 'do') continue;
      const bold = block.text.match(/\*\*[^*]+\*\*/g) ?? [];
      assert.ok(
        bold.length >= 1 && bold.length <= 3,
        `${lesson.id} has a paragraph with ${bold.length} bold runs`,
      );
      const words = block.text.replace(/\*\*/g, '').split(/\s+/).length;
      assert.ok(words <= 45, `${lesson.id} has a ${words}-word paragraph`);
    }
  }
});

test('the bold alone reads as the lesson', () => {
  // Not a judgement of the writing — only that there is enough of it to read.
  for (const lesson of allLessons()) {
    const bold = (prose(lesson).match(/\*\*[^*]+\*\*/g) ?? []).join(' ');
    const words = bold.replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 6, `${lesson.id}'s skim path is ${words} words`);
  }
});

test('a list is a set worth setting out, not a paragraph in disguise', () => {
  for (const lesson of allLessons()) {
    for (const block of lesson.blocks) {
      if (block.kind !== 'list') continue;
      assert.ok(
        block.items.length >= 2 && block.items.length <= 4,
        `${lesson.id} has a list of ${block.items.length}`,
      );
      for (const item of block.items) {
        assert.ok(item.term.split(/\s+/).length <= 4, `${lesson.id}: ${item.term}`);
      }
    }
  }
});

test('the title is the claim, not the topic', () => {
  for (const lesson of allLessons()) {
    const words = lesson.title.split(/\s+/).length;
    assert.ok(words >= 3, `${lesson.id} titled "${lesson.title}" names a topic`);
    assert.ok(words <= 9, `${lesson.id} has a ${words}-word title`);
    assert.equal(lesson.title.endsWith('.'), false, lesson.id);
  }
});

test('every claim can be checked by somebody who did not write it', () => {
  for (const lesson of allLessons()) {
    assert.ok(lesson.source.length > 30, `${lesson.id} has no usable source`);
  }
});

test('no banned word reached a lesson', () => {
  // `feedback_banned_words_breathwork`. Lessons are the likeliest place for
  // these to come back, being the only long-form copy in the app.
  for (const lesson of allLessons()) {
    const text = `${lesson.title} ${prose(lesson)}`.toLowerCase();
    assert.equal(text.includes('breathwork'), false, lesson.id);
    assert.equal(text.includes('exercise'), false, lesson.id);
  }
});

test('every day of every plan has a lesson, and exactly one', () => {
  for (const planId of PLAN_IDS) {
    const sequence = LESSON_SEQUENCES[planId];
    const length = planLength(planId);
    assert.equal(sequence.length, length, planId);
    for (let day = 1; day <= length; day += 1) {
      assert.notEqual(lessonForDay(planId, day), null, `${planId} day ${day}`);
    }
  }
});

test('every placement names a lesson that exists', () => {
  for (const planId of PLAN_IDS) {
    for (const lessonId of LESSON_SEQUENCES[planId]) {
      assert.equal(lessonById(lessonId).id, lessonId);
    }
  }
});

test('no plan reads the same lesson twice', () => {
  // A day that repeats a screen from three weeks ago reads as the plan having
  // run out, which is the one thing a daily lesson cannot afford to look like.
  for (const planId of PLAN_IDS) {
    const ids = LESSON_SEQUENCES[planId];
    assert.equal(new Set(ids).size, ids.length, planId);
  }
});

test('the lessons are shared, not written five times over', () => {
  const slots = PLAN_IDS.reduce(
    (total, planId) => total + LESSON_SEQUENCES[planId].length,
    0,
  );
  const used = new Set(PLAN_IDS.flatMap((planId) => LESSON_SEQUENCES[planId]));
  // 196 days across the five plans. Five unique sets would be 196 lessons to
  // write and keep in agreement with each other.
  assert.ok(used.size < slots / 2, `${used.size} lessons for ${slots} days`);
  assert.equal(used.size, allLessons().length, 'a lesson nobody is shown');
});

test('no plan is a month of identically shaped screens', () => {
  for (const planId of PLAN_IDS) {
    const shapes = LESSON_SEQUENCES[planId].map((lessonId) =>
      lessonById(lessonId)
        .blocks.map((block) => block.kind)
        .join('-'),
    );
    assert.ok(new Set(shapes).size >= 4, `${planId} has ${new Set(shapes).size} shapes`);
    const lists = LESSON_SEQUENCES[planId].filter((lessonId) =>
      lessonById(lessonId).blocks.some((block) => block.kind === 'list'),
    );
    assert.ok(lists.length >= 2, `${planId} has ${lists.length} lists`);
  }
});

test('no two days running are the same shape', () => {
  // Read on consecutive days, two identical layouts read as one screen shown
  // twice. It is the cheapest thing to check and the easiest to break.
  for (const planId of PLAN_IDS) {
    const shapes = LESSON_SEQUENCES[planId].map((lessonId) =>
      lessonById(lessonId)
        .blocks.map((block) => block.kind)
        .join('-'),
    );
    let longestRun = 1;
    let run = 1;
    for (let index = 1; index < shapes.length; index += 1) {
      run = shapes[index] === shapes[index - 1] ? run + 1 : 1;
      longestRun = Math.max(longestRun, run);
    }
    assert.ok(longestRun <= 3, `${planId} runs ${longestRun} identical shapes`);
  }
});

test('a day off the end of the plan asks for nothing', () => {
  assert.equal(lessonForDay('night', 0), null);
  assert.equal(lessonForDay('night', 29), null);
});

test('no lesson lists the same term twice', () => {
  // The screen keys list rows by their term, and a repeat would drop one.
  for (const lesson of allLessons()) {
    for (const block of lesson.blocks) {
      if (block.kind !== 'list') continue;
      const terms = block.items.map((item) => item.term);
      assert.equal(new Set(terms).size, terms.length, lesson.id);
    }
  }
});

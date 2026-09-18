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
  lessonPositionForDay,
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

test('every plan gets ten lessons, in order, inside the plan', () => {
  for (const planId of PLAN_IDS) {
    const sequence = LESSON_SEQUENCES[planId];
    assert.equal(sequence.length, 10, planId);

    const length = planLength(planId);
    let previous = 0;
    for (const { day } of sequence) {
      assert.ok(day > previous, `${planId} repeats or reverses at day ${day}`);
      assert.ok(day >= 1 && day <= length, `${planId} places a lesson on ${day}`);
      previous = day;
    }
  }
});

test('every plan opens and closes on a lesson', () => {
  for (const planId of PLAN_IDS) {
    const sequence = LESSON_SEQUENCES[planId];
    const length = planLength(planId);
    assert.equal(sequence[0].day, 1, planId);
    assert.equal(sequence[sequence.length - 1].day, length, planId);
  }
});

test('the day a second exercise joins is a day with a lesson', () => {
  // True of all five plans, and it is the day the plan first asks for more.
  for (const planId of PLAN_IDS) {
    assert.notEqual(lessonForDay(planId, 8), null, planId);
  }
});

test('every placement names a lesson that exists', () => {
  for (const planId of PLAN_IDS) {
    for (const { lessonId } of LESSON_SEQUENCES[planId]) {
      assert.equal(lessonById(lessonId).id, lessonId);
    }
  }
});

test('no plan reads the same lesson twice', () => {
  for (const planId of PLAN_IDS) {
    const ids = LESSON_SEQUENCES[planId].map(({ lessonId }) => lessonId);
    assert.equal(new Set(ids).size, ids.length, planId);
  }
});

test('the lessons are shared, not written five times over', () => {
  const used = new Set(
    PLAN_IDS.flatMap((planId) =>
      LESSON_SEQUENCES[planId].map(({ lessonId }) => lessonId),
    ),
  );
  // 50 slots. Five unique sets would be 50 lessons to write and maintain.
  assert.ok(used.size <= 30, `${used.size} lessons for 50 slots`);
  assert.equal(used.size, allLessons().length, 'a lesson nobody is shown');
});

test('no plan is ten identically shaped screens', () => {
  for (const planId of PLAN_IDS) {
    const shapes = LESSON_SEQUENCES[planId].map(({ lessonId }) =>
      lessonById(lessonId)
        .blocks.map((block) => block.kind)
        .join('-'),
    );
    assert.ok(new Set(shapes).size >= 3, `${planId} has ${new Set(shapes).size} shapes`);
    const lists = LESSON_SEQUENCES[planId].filter(({ lessonId }) =>
      lessonById(lessonId).blocks.some((block) => block.kind === 'list'),
    );
    assert.ok(lists.length >= 1, `${planId} never breaks out of prose`);
  }
});

test('most days have no lesson at all', () => {
  for (const planId of PLAN_IDS) {
    const length = planLength(planId);
    const withLesson = Array.from({ length }, (_, index) =>
      lessonForDay(planId, index + 1),
    ).filter((lesson) => lesson != null);
    assert.equal(withLesson.length, 10, planId);
    assert.ok(withLesson.length / length <= 0.4, planId);
  }
});

test('a day off the end of the plan asks for nothing', () => {
  assert.equal(lessonForDay('night', 0), null);
  assert.equal(lessonForDay('night', 29), null);
  assert.equal(lessonPositionForDay('night', 29), null);
});

test('the position is how far through the lessons, not through the plan', () => {
  assert.deepEqual(lessonPositionForDay('night', 1), { index: 1, total: 10 });
  assert.deepEqual(lessonPositionForDay('night', 28), { index: 10, total: 10 });
  assert.deepEqual(lessonPositionForDay('pressure', 22), { index: 6, total: 10 });
});

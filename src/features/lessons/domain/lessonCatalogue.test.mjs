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
  lessonRowTitle,
  lessonSubject,
  lessonById,
  lessonForDay,
  lessonForActivityId,
  LESSON_SEQUENCES,
  PRESSURE_LESSON_SEQUENCES,
  RETIRED_LESSON_IDS,
  usesPracticalLessonSequence,
} from './lessonCatalogue.ts';
import {
  PROGRAM_ACTIVITIES,
  allProgramPresets,
  latestProgramPreset,
} from '../../program/domain/programCatalogue.ts';
import { TEACHING_MUSCLE_LESSON } from './lessons/attentionLessons.ts';
import { LIFE_RESET_LESSONS } from './lessons/lifeResetLessons.ts';
import { lessonPages } from './lessonPages.ts';
import { SHORT_RESET_PLAN_PURPOSE } from '../../program/domain/programResetPurpose.ts';
import { PRE_TEACHING_LESSON_SEQUENCES, PRE_TEACHING_PRESSURE_SEQUENCES } from './preTeachingLessonSequences.ts';

/** The plan's length in days. `days` is contiguous from 1. */
function planLength(planId) {
  return latestProgramPreset(planId).days.length;
}

const PLAN_IDS = [...new Set(allProgramPresets().map((preset) => preset.planId))];

const NEW_TOPIC_LESSONS = {
  night: ['sleep.room', 'sleep.noise', 'sleep.screen', 'sleep.meal', 'sleep.clock'],
  morning: ['body.morningprep', 'body.firststeps', 'body.morningfood'],
  pressure: ['anger.oneproblem', 'anger.askhelp', 'anger.afterstress'],
  focus: ['focus.nextstep', 'focus.parkthought', 'focus.readback'],
  quiet: ['quiet.onesound', 'quiet.waiting', 'quiet.namefeeling'],
  home: ['focus.homelaundry', 'focus.homedishes', 'focus.homeshared'],
  phone: ['focus.phonepurpose', 'focus.phonemessages', 'focus.phonebed'],
  recovery: ['body.restchoice', 'body.shareload', 'body.energycost'],
  selfTrust: ['quiet.smalldecision', 'quiet.changemind', 'quiet.askadvice'],
};

function prose(lesson) {
  return lesson.blocks
    .flatMap((block) => {
      if (block.kind === 'text' || block.kind === 'do') return [block.text];
      if (block.kind === 'list') {
        return block.items.flatMap((item) => [item.term, item.text]);
      }
      if (block.kind === 'choice') {
        return [block.prompt, ...block.options.flatMap((option) => [option.label, option.feedback])];
      }
      if (block.kind === 'reveal') {
        return [block.prompt, ...block.items.flatMap((item) => [item.label, item.detail])];
      }
      if (block.kind === 'sequence') return [block.prompt, ...block.steps, block.feedback];
      return [block.value, block.caption];
    })
    .join(' ');
}

function wordCount(lesson) {
  // Only one answer and its feedback are shown to a reader.
  const visible = lesson.blocks.map((block) => {
    if (block.kind !== 'choice') return prose({ blocks: [block] });
    const longestAnswer = block.options
      .map((option) => `${option.label} ${option.feedback}`)
      .sort((a, b) => b.length - a.length)[0];
    return `${block.prompt} ${longestAnswer}`;
  });
  return visible.join(' ').replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;
}

test('a lesson has five to eight focused blocks, never one wall of prose', () => {
  for (const lesson of allLessons()) {
    assert.ok(
      lesson.blocks.length >= 5 && lesson.blocks.length <= 8,
      `${lesson.id} has ${lesson.blocks.length} blocks`,
    );
  }
});

test('every lesson ends on one closing invitation', () => {
  for (const lesson of allLessons()) {
    const dos = lesson.blocks.filter((block) => block.kind === 'do');
    assert.equal(dos.length, 1, `${lesson.id}`);
    assert.equal(
      lesson.blocks[lesson.blocks.length - 1].kind,
      'do',
      `${lesson.id} does not end on its closing invitation`,
    );
  }
});

test('a lesson explains its idea beyond a short summary', () => {
  for (const lesson of allLessons()) {
    const words = wordCount(lesson);
    assert.ok(words >= 200, `${lesson.id} is only ${words} words`);
  }
});

test('every rendered prose slide is brief but still a complete thought', () => {
  for (const lesson of allLessons()) {
    const pages = lessonPages(lesson.blocks);
    assert.equal(pages.at(-1)?.kind, 'do', `${lesson.id} lost its closing action`);
    for (const page of pages) {
      if (page.kind !== 'text') continue;
      const words = page.text.replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;
      assert.ok(words >= 15 && words <= 45, `${lesson.id} has a ${words}-word prose slide`);
    }
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
      assert.ok(words <= 120, `${lesson.id} has a ${words}-word paragraph`);
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

test('application questions have distinct choices and useful feedback', () => {
  for (const lesson of allLessons()) {
    for (const block of lesson.blocks) {
      if (block.kind !== 'choice') continue;
      assert.ok(block.prompt.length > 20, lesson.id);
      assert.ok(block.options.length >= 2 && block.options.length <= 3, lesson.id);
      assert.equal(new Set(block.options.map((option) => option.label)).size, block.options.length, lesson.id);
      for (const option of block.options) {
        assert.ok(option.feedback.length > 30, `${lesson.id}: ${option.label}`);
      }
    }
  }
});

test('interactive activities have enough distinct content to practise', () => {
  for (const lesson of allLessons()) {
    for (const block of lesson.blocks) {
      if (block.kind === 'reveal') {
        assert.ok(block.prompt.length > 20, lesson.id);
        assert.ok(block.items.length >= 2 && block.items.length <= 3, lesson.id);
        assert.equal(new Set(block.items.map((item) => item.label)).size, block.items.length, lesson.id);
        for (const item of block.items) assert.ok(item.detail.length > 30, lesson.id);
      }
      if (block.kind === 'sequence') {
        assert.ok(block.prompt.length > 20, lesson.id);
        assert.equal(block.steps.length, 3, lesson.id);
        assert.equal(new Set(block.steps).size, block.steps.length, lesson.id);
        assert.ok(block.feedback.length > 30, lesson.id);
      }
    }
  }
});

test('every plan includes both new ways to practise', () => {
  for (const planId of PLAN_IDS) {
    const kinds = new Set(LESSON_SEQUENCES[planId].flatMap((id) => lessonById(id).blocks.map((block) => block.kind)));
    assert.ok(kinds.has('reveal'), `${planId} has no tap-to-reveal example`);
    assert.ok(kinds.has('sequence'), `${planId} has no step-ordering activity`);
  }
});

test('each plan teaches an applied skill near its start', () => {
  for (const planId of PLAN_IDS) {
    const earlyLessons = LESSON_SEQUENCES[planId].slice(0, 4).map(lessonById);
    assert.ok(
      earlyLessons.some((lesson) => lesson.blocks.some((block) => block.kind === 'choice')),
      `${planId} has no early application question`,
    );
  }
});

test('goal lessons include an applied choice', () => {
  const reflectionLessons = new Set(LIFE_RESET_LESSONS.map((lesson) => lesson.id));
  for (const lesson of allLessons()) {
    if (reflectionLessons.has(lesson.id)) {
      // The life-reset catalogue uses its closing reflection as the practice
      // moment, while dedicated goal lessons use a scenario choice.
      continue;
    }
    assert.ok(lesson.blocks.some((block) => block.kind === 'choice'), `${lesson.id} has no applied choice`);
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

test('general plan guidance leaves most days for the chosen goal', () => {
  const earlyReviewPlans = new Set(['night', 'morning', 'pressure', 'focus', 'quiet']);
  for (const planId of PLAN_IDS) {
    const generalLessons = LESSON_SEQUENCES[planId].filter((id) => id.startsWith('plan.'));
    const allowed = earlyReviewPlans.has(planId)
      ? ['plan.grows', 'plan.missed', 'plan.clear', 'plan.carry']
      : ['plan.grows', 'plan.carry'];
    assert.ok(generalLessons.length <= allowed.length, `${planId} has too much general guidance`);
    for (const id of generalLessons) {
      assert.ok(allowed.includes(id), `${planId} includes ${id} instead of a goal lesson`);
    }
  }
});

test('each plan includes its new practical lessons about its goal', () => {
  for (const [planId, ids] of Object.entries(NEW_TOPIC_LESSONS)) {
    for (const id of ids) {
      assert.ok(LESSON_SEQUENCES[planId].includes(id), `${planId} does not teach ${id}`);
    }
  }
});

test('new goal lessons use plain punctuation and identifiable sources', () => {
  for (const id of Object.values(NEW_TOPIC_LESSONS).flat()) {
    const lesson = lessonById(id);
    const copy = `${lesson.title} ${lesson.step} ${prose(lesson)}`;
    assert.doesNotMatch(copy, /[\u2013\u2014]/, `${id} uses a long dash`);
    assert.doesNotMatch(copy, /\b(breathwork|exercise)\b/i, `${id} uses a banned word`);
    assert.match(
      lesson.source,
      /https:\/\/|^Author practical example:/,
      `${id} needs a reference or an explicit author example without health claims`,
    );
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

test('the lessons are shared, not written once per plan day', () => {
  const paths = [
    ...Object.values(LESSON_SEQUENCES),
    PRESSURE_LESSON_SEQUENCES.overthinking,
    PRESSURE_LESSON_SEQUENCES.anger,
  ];
  const slots = paths.reduce((total, sequence) => total + sequence.length, 0);
  const used = new Set(paths.flat());
  // Multiple plans share the same well-supported lessons rather than copying
  // nearly identical prose into every plan.
  assert.ok(used.size < slots / 2, `${used.size} lessons for ${slots} days`);
  for (const retired of RETIRED_LESSON_IDS) {
    assert.equal(used.has(retired), false, `${retired} is retired but placed`);
  }
  assert.equal(
    used.size + RETIRED_LESSON_IDS.length,
    allLessons().length,
    'a lesson nobody is shown',
  );
});

test('every plan closes on what to keep', () => {
  for (const planId of PLAN_IDS) {
    assert.equal(LESSON_SEQUENCES[planId].at(-1), 'plan.carry', planId);
  }
});

test('the home-session plans open on how the reset works, and grow when the plan does', () => {
  // Day one explains the session they are about to repeat, and the lesson on
  // how the plan grows lands on the day it actually does: the first day it
  // asks for more than one every day, not a one-off tool day before it.
  const opening = {
    night: ['breath.exhale', 8],
    pressure: ['breath.exhale', 8],
    focus: ['breath.exhale', 8],
    quiet: ['breath.exhale', 8],
    home: ['breath.exhale', 8],
    phone: ['breath.exhale', 8],
    recovery: ['breath.exhale', 8],
    selfTrust: ['breath.exhale', 8],
    morning: ['breath.wake', 8],
  };
  for (const [planId, [first, expectedGrowthDay]] of Object.entries(opening)) {
    const sequence = LESSON_SEQUENCES[planId];
    assert.equal(sequence[0], first, planId);
    const preset = latestProgramPreset(planId);
    const growthDay =
      preset.days.findLast((day) => day.activityIds.length === 1).day + 1;
    assert.equal(growthDay, expectedGrowthDay, planId);
    assert.equal(sequence[growthDay - 1], planId === 'night' ? 'plan.grows' : 'attention.grows', planId);
  }
});

test("a tool added for one day in the first week is the one that day's lesson teaches", () => {
  const PAIRED_LESSONS = {
    'attention.54321.2': ['sleep.threeam', 'anger.recovery', 'quiet.notice', 'quiet.eyes', 'focus.pull', ...['morning', 'focus', 'quiet', 'home', 'phone', 'recovery', 'selfTrust', 'stress'].map((plan) => `attention.senses${plan.toLowerCase()}`)],
    'attention.muscle-release.2': ['sleep.bed', 'sleep.wind', 'anger.cues', 'body.evening', ...['morning', 'focus', 'quiet', 'home', 'phone', 'recovery', 'selfTrust', 'stress'].map((plan) => `attention.muscles${plan.toLowerCase()}ready`)],
  };
  for (const planId of PLAN_IDS) {
    const firstWeek = latestProgramPreset(planId).days.slice(0, 7);
    for (const day of firstWeek) {
      for (const activityId of day.activityIds) {
        if (PROGRAM_ACTIVITIES.get(activityId).delivery.modality !== 'attention') continue;
        const lessonId = LESSON_SEQUENCES[planId][day.day - 1];
        assert.ok(
          (PAIRED_LESSONS[activityId] ?? []).includes(lessonId),
          `${planId} day ${day.day} adds ${activityId} beside ${lessonId}`,
        );
      }
    }
  }
});

test('a stored lesson read is looked up by its id, and an unknown one is nothing', () => {
  assert.equal(lessonForActivityId('lesson:breath.exhale')?.id, 'breath.exhale');
  assert.equal(lessonForActivityId('lesson:plan.expect')?.id, 'plan.expect');
  assert.equal(lessonForActivityId('lesson:no.such'), null);
  assert.equal(lessonForActivityId('breathing.box.3'), null);
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

test('every lesson has a row title, and it says what kind of tip it is', () => {
  // A subject with no entry would fall through as `undefined` and put a blank
  // row on Home — the row that is supposed to be the reason to open it.
  for (const lesson of allLessons()) {
    const title = lessonRowTitle(lesson.id);
    assert.equal(typeof title, 'string', lesson.id);
    assert.ok(title.length > 0, lesson.id);
    assert.ok(title.startsWith('Learn '), `${lesson.id}: ${title}`);
  }
});

test('the subject is read off the id, and every id has one', () => {
  const subjects = new Set(allLessons().map((lesson) => lessonSubject(lesson.id)));
  assert.deepEqual(
    [...subjects].sort(),
    ['anger', 'attention', 'body', 'breath', 'focus', 'plan', 'quiet', 'sleep', 'stress', 'worry'],
  );
});

test('each pressure lesson path has eight complete weeks and teaches its own problem', () => {
  const required = {
    stress: ['stress.signs', 'stress.load', 'stress.boundary'],
    overthinking: ['worry.loop', 'worry.facts', 'worry.uncertainty'],
    anger: ['anger.meter', 'anger.cues', 'anger.repair'],
  };
  const angerSpecific = ['anger.meter', 'anger.recovery', 'anger.cues', 'anger.send',
    'anger.driving', 'anger.repair', 'anger.assert', 'anger.belief', 'anger.rumination'];
  for (const [track, sequence] of Object.entries(PRESSURE_LESSON_SEQUENCES)) {
    assert.equal(sequence.length, 56, track);
    assert.equal(new Set(sequence).size, 56, track);
    assert.equal(sequence[2], `attention.senses${track}`, track);
    assert.equal(sequence[5], `attention.muscles${track}ready`, track);
    assert.equal(sequence[7], 'attention.grows', track);
    assert.equal(sequence.at(-1), 'plan.carry', track);
    for (const id of required[track]) assert.ok(sequence.includes(id), `${track}: ${id}`);
    if (track !== 'anger') {
      for (const id of angerSpecific) assert.equal(sequence.includes(id), false, `${track}: ${id}`);
    }
    let previousShape = null;
    let run = 0;
    for (const id of sequence) {
      const shape = lessonById(id).blocks.map((block) => block.kind).join('-');
      run = shape === previousShape ? run + 1 : 1;
      assert.ok(run <= 3, `${track} repeats its lesson layout too often at ${id}`);
      previousShape = shape;
    }
  }
});


test('tool introductions and practical teaching match the scheduled practice', () => {
  for (const planId of ['morning', 'focus', 'quiet', 'home', 'phone', 'recovery', 'selfTrust']) {
    const preset = latestProgramPreset(planId);
    const groundingDay = planId === 'quiet' ? 5 : 3;
    assert.ok(preset.days[groundingDay - 1].activityIds.includes('attention.54321.2'), planId);
    assert.equal(LESSON_SEQUENCES[planId][groundingDay - 1], `attention.senses${planId.toLowerCase()}`, planId);
    assert.ok(preset.days[5].activityIds.includes('attention.muscle-release.2'), planId);
    assert.equal(LESSON_SEQUENCES[planId][5], `attention.muscles${planId.toLowerCase()}ready`, planId);
    if (planId !== 'quiet') assert.equal(LESSON_SEQUENCES[planId][3], 'attention.anchor', planId);
    assert.equal(LESSON_SEQUENCES[planId][6], 'attention.effort', planId);
    assert.equal(LESSON_SEQUENCES[planId][7], 'attention.grows', planId);
  }
  assert.match(prose(lessonById('attention.senses')), /five things you see, four sounds you hear, three things you touch, two smells, and one taste/);
  assert.match(prose(lessonById('attention.muscles')), /hands, shoulders, face, legs, and whole body/);
  assert.doesNotMatch(prose(lessonById('attention.effort')), /yesterday|look back|Did you try/i);
});

test('every pressure track pairs tool instructions and teaching with the actual reset days', () => {
  const preset = latestProgramPreset('pressure');
  for (const [track, sequence] of Object.entries(PRESSURE_LESSON_SEQUENCES)) {
    for (const [day, tool, activityId] of [
      [3, 'senses', 'attention.54321.2'],
      [6, 'muscles', 'attention.muscle-release.2'],
    ]) {
      assert.ok(preset.days[day - 1].activityIds.includes(activityId), `${track} day ${day}`);
      const lesson = lessonById(sequence[day - 1]);
      assert.equal(lesson.id, `attention.${tool}${track}${tool === 'muscles' ? 'ready' : ''}`);
      const shared = lessonById(`attention.${tool}`);
      assert.deepEqual(lesson.blocks.slice(1, -1), (tool === 'muscles' ? TEACHING_MUSCLE_LESSON : shared).blocks.slice(0, -1));
      assert.match(lesson.blocks.at(-1).text, tool === 'senses' ? /5-4-3-2-1/ : /Muscle Release/);
    }
    assert.equal(sequence[3], 'attention.anchor', track);
    assert.equal(sequence[6], 'attention.effort', track);
    assert.equal(sequence[7], 'attention.grows', track);
    assert.deepEqual(preset.days[7].activityIds, [
      'breathing.extended-exhale.1', 'attention.muscle-release.2',
    ], track);
    for (const day of preset.days) {
      for (const activityId of day.activityIds.filter((id) => id.startsWith('breathing.'))) {
        assert.match(activityId, /\.[12]$/, `${track} day ${day.day}`);
      }
    }
  }
  assert.doesNotMatch(prose(lessonById('attention.anchor')), /yesterday|look back|Did you try/i);
  assert.doesNotMatch(prose(lessonById('attention.effort')), /yesterday|look back|Did you try/i);
});

test('new plans replace retrospective review lessons while historical fallbacks stay frozen', () => {
  const removed = new Set(['attention.return', 'attention.week', 'plan.week', 'plan.after', 'quiet.yesterday']);
  const paths = [...Object.values(LESSON_SEQUENCES), ...Object.values(PRESSURE_LESSON_SEQUENCES)];
  for (const sequence of paths) {
    for (const id of sequence) assert.equal(removed.has(id), false, id);
  }
  for (const planId of PLAN_IDS) {
    const current = latestProgramPreset(planId);
    assert.equal(usesPracticalLessonSequence(planId, current.revision), true, planId);
    assert.equal(usesPracticalLessonSequence(planId, current.revision - 1), false, planId);
    for (const [index, id] of PRE_TEACHING_LESSON_SEQUENCES[planId].entries()) {
      assert.equal(lessonForDay(planId, index + 1, current.revision - 1)?.id, id, `${planId} day ${index + 1}`);
    }
  }
  for (const [track, sequence] of Object.entries(PRE_TEACHING_PRESSURE_SEQUENCES)) {
    for (const [index, id] of sequence.entries()) {
      assert.equal(lessonForDay('pressure', index + 1, 3, track)?.id, id);
    }
  }
  for (const sequence of paths) {
    for (const id of sequence.filter((item) => item.startsWith('attention.muscles'))) {
      assert.doesNotMatch(prose(lessonById(id)), /think back|did you try|yesterday/i, id);
    }
  }
});


test('tool lessons keep their shared instructions and explain the chosen plan purpose', () => {
  for (const [planId, purpose] of Object.entries(SHORT_RESET_PLAN_PURPOSE)) {
    for (const tool of ['senses', 'muscles']) {
      const original = lessonById(`attention.${tool}`);
      const lesson = lessonById(`attention.${tool}${planId.toLowerCase()}${tool === 'muscles' ? 'ready' : ''}`);
      assert.equal(lesson.blocks[0].kind, 'text');
      assert.ok(lesson.blocks[0].text.startsWith(purpose), `${planId} ${tool}`);
      assert.deepEqual(lesson.blocks.slice(1, -1), (tool === 'muscles' ? TEACHING_MUSCLE_LESSON : original).blocks.slice(0, -1));
      assert.equal(lesson.blocks.at(-1).kind, 'do');
      assert.notEqual(lesson.blocks.at(-1).text, original.blocks.at(-1).text);
    }
  }
  assert.match(prose(lessonById('attention.musclesmorningready')), /not an energy boost/);
  assert.match(prose(lessonById('attention.musclesrecoveryready')), /including rest/);
  assert.match(prose(lessonById('attention.grows')), /already tried these tools on earlier days/);
});

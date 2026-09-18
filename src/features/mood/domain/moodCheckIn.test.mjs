import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOOD_FACES,
  MOOD_SCALES,
  MOOD_SCALE_MAX,
  MOOD_SCALE_MIN,
  isCompleteMoodAnswers,
  moodBand,
  moodReply,
  moodScore,
  moodRecommendationLine,
  moodSuggestion,
  moodFaceFor,
  moodFaceForBand,
  sanitizeMoodAnswers,
  weakestMoodScale,
} from './moodCheckIn.ts';

const all = (value) =>
  Object.fromEntries(MOOD_SCALES.map((q) => [q.id, value]));

const answers = (scales) => scales;

test('every question is asked so that higher is better', () => {
  // The direction is a property of the whole set. One reversed scale turns a
  // bad day into an average one the moment the answers are meaned together.
  assert.equal(moodScore(all(MOOD_SCALE_MIN)), 0);
  assert.equal(moodScore(all(MOOD_SCALE_MAX)), 100);
  assert.equal(moodScore(all(3)), 50);
});

test('every question has a label for every point on its scale', () => {
  for (const question of MOOD_SCALES) {
    assert.equal(
      question.labels.length,
      MOOD_SCALE_MAX - MOOD_SCALE_MIN + 1,
      question.id,
    );
    for (const label of question.labels) assert.ok(label.length > 0);
  }
});

test('a check-in is not complete until every scale is answered', () => {
  assert.equal(isCompleteMoodAnswers({}), false);
  assert.equal(isCompleteMoodAnswers({ overall: 3 }), false);
  assert.equal(isCompleteMoodAnswers(all(3)), true);
});

test('a rating off the scale is not an answer', () => {
  for (const bad of [0, 6, 2.5, -1, '3', null]) {
    assert.equal(
      isCompleteMoodAnswers({ ...all(3), overall: bad }),
      false,
      `${bad}`,
    );
  }
});

/**
 * The column is jsonb and the questions will change. A row can hold a scale
 * this build no longer asks, or be missing one it now does.
 */
test('a stored answer keeps what it can and drops what it cannot read', () => {
  const read = sanitizeMoodAnswers({
    overall: 4,
    retired_scale: 2,
    energy: 99,
  });

  assert.deepEqual(read, { overall: 4 });
});

test('a missing scale is never filled in with a middle value', () => {
  // A 3 nobody gave is the one number that would quietly flatter a bad week.
  const read = sanitizeMoodAnswers({ overall: 1 });

  assert.equal(read.energy, undefined);
  assert.equal(isCompleteMoodAnswers(read), false);
});

test('a sanitized answer survives a value that is not an object', () => {
  for (const raw of [null, undefined, 4, 'x']) {
    assert.deepEqual(sanitizeMoodAnswers(raw), {});
  }
});

test('the bands split the scale into a bad day, a middling one and a good one', () => {
  assert.equal(moodBand(moodScore(all(1))), 'low');
  assert.equal(moodBand(moodScore(all(2))), 'low');
  assert.equal(moodBand(moodScore(all(3))), 'middling');
  assert.equal(moodBand(moodScore(all(4))), 'good');
  assert.equal(moodBand(moodScore(all(5))), 'good');
});

test('the weakest scale is the one a suggestion falls back to', () => {
  assert.equal(
    weakestMoodScale(answers({ overall: 4, energy: 4, sleep: 1 })),
    'sleep',
  );
  assert.equal(
    weakestMoodScale(answers({ overall: 4, energy: 2, sleep: 4 })),
    'energy',
  );
});

test('an equally low day is answered on what they said about the day itself', () => {
  assert.equal(weakestMoodScale(all(1)), 'overall');
});

/**
 * An app that answers "I'm good" with an exercise is not listening, it is
 * selling. Only a low day earns a suggestion.
 */
test('only a bad day is offered an exercise', () => {
  assert.equal(moodSuggestion(all(5)), null);
  assert.equal(moodSuggestion(all(4)), null);
  assert.equal(moodSuggestion(all(3)), null);
  assert.ok(moodSuggestion(all(2)) != null);
  assert.ok(moodSuggestion(all(1)) != null);
});

test('the exercise offered answers the scale that dragged the day down', () => {
  const tired = moodSuggestion({ overall: 2, energy: 1, sleep: 2 });
  assert.equal(tired.answering, 'energy');
  assert.equal(tired.techniqueId, 'morning-charge');
  assert.equal(tired.remedy, 'energizing');

  const unslept = moodSuggestion({ overall: 2, energy: 2, sleep: 1 });
  assert.equal(unslept.answering, 'sleep');
  assert.equal(unslept.remedy, 'wind-down');

  const flat = moodSuggestion(all(2));
  assert.equal(flat.answering, 'overall');
  assert.equal(flat.remedy, 'steadying');
});

/**
 * Wim Hof and Bellows are high-ventilation. No plan prescribes one, and neither
 * may a screen that has just been told the user is having a bad day.
 */
test('nothing high-ventilation is offered after a bad day', () => {
  for (const scale of MOOD_SCALES) {
    const low = { ...all(3), [scale.id]: 1 };
    const { techniqueId } = moodSuggestion({ ...low, overall: 1 });
    assert.ok(!['wimhof', 'bhastrika'].includes(techniqueId), scale.id);
  }
});

test('a flat day is not offered something calming', () => {
  assert.equal(
    moodSuggestion({ overall: 2, energy: 1, sleep: 2 }).remedy,
    'energizing',
  );
});

/**
 * One sentence, not a headline and a subtitle. The page is a statement and two
 * buttons, and a second paragraph would make it a page to read rather than a
 * choice to make.
 */
test('the recommendation is one sentence, in the remedy it offers', () => {
  const line = moodRecommendationLine('wind-down');

  assert.match(line, /^We understand how you are feeling\./);
  assert.match(line, /short wind-down exercise/);
  assert.ok(!line.includes('\n'));
});

test('what the app says back never congratulates a bad day', () => {
  for (const band of ['low', 'middling', 'good']) {
    assert.ok(moodReply(band).length > 0, band);
  }
  assert.doesNotMatch(moodReply('low'), /great|well done|amazing|keep it up/i);
});

/**
 * The bad-day reply is a headline over an offer, not the whole answer. It used
 * to thank the user for having answered, which is the app congratulating itself
 * for asking while the actual help sat buried under a label further down.
 */
test('the bad-day reply does not thank the user for answering', () => {
  assert.doesNotMatch(moodReply('low'), /thank|logging|logged/i);
  assert.ok(moodReply('low').length < 60);
});


/**
 * One set of faces for all four questions. Five faces that mean the same five
 * things wherever they appear is what lets somebody answer the fourth question
 * without re-reading it; four different sets would make each one a fresh puzzle.
 */
test('there is a face for every point of the scale, and no more', () => {
  assert.equal(MOOD_FACES.length, MOOD_SCALE_MAX - MOOD_SCALE_MIN + 1);
  assert.equal(new Set(MOOD_FACES).size, MOOD_FACES.length);
});

test('the faces run worst to best, the same direction as the scale', () => {
  assert.equal(moodFaceFor(MOOD_SCALE_MIN), 'face-sad');
  assert.equal(moodFaceFor(3), 'face-neutral');
  assert.equal(moodFaceFor(MOOD_SCALE_MAX), 'face-happy');
});

test('a rating off the scale still resolves to a face rather than nothing', () => {
  // The reply page reads a stored answer, and a row written by an older set of
  // questions must not render a blank where a face goes.
  assert.equal(moodFaceFor(-4), 'face-sad');
  assert.equal(moodFaceFor(99), 'face-happy');
});


/**
 * Every face carries its own word, so the scale explains itself. A subtitle
 * above a row that is already legible is one more thing to read on a screen
 * whose whole point is that there is only one thing on it.
 */
test('a question is a question, with nothing else attached to it', () => {
  for (const question of MOOD_SCALES) {
    assert.equal(Object.hasOwn(question, 'hint'), false, question.id);
    assert.match(question.question, /\?$/, question.id);
  }
});

/**
 * Five columns across the narrowest phone leaves each word about 71pt, which is
 * seven or eight characters at 16pt, over two reserved lines.
 *
 * The length that actually matters is the longest *word*: a label can wrap at a
 * space, but a single word wider than its column has nowhere to break and is
 * clipped instead.
 */
test('every label fits in the column under its face', () => {
  for (const question of MOOD_SCALES) {
    for (const label of question.labels) {
      assert.ok(label.length <= 14, `${question.id}: "${label}" is too long`);
      for (const word of label.split(' ')) {
        assert.ok(word.length <= 8, `${question.id}: "${word}" cannot wrap`);
      }
    }
  }
});


/**
 * The face and the sentence are the same statement, so they come off the same
 * number. The face used to be read from "How are you doing?" alone, which is
 * one of three answers the reply is not based on: somebody could rate that a 3,
 * score well on the other two, and be told "Good to hear" under a flat face.
 */
test('the reply face matches the reply it sits above', () => {
  assert.equal(moodFaceForBand('good'), 'face-happy');
  assert.equal(moodFaceForBand('middling'), 'face-neutral');
  assert.equal(moodFaceForBand('low'), 'face-sad');
});

test('every band has a face, and no two bands share one', () => {
  const faces = ['low', 'middling', 'good'].map(moodFaceForBand);
  assert.equal(new Set(faces).size, faces.length);
  for (const face of faces) assert.ok(MOOD_FACES.includes(face));
});

test('the check-in is three scales, and none of them asks for a feeling', () => {
  assert.equal(MOOD_SCALES.length, 3);
  for (const scale of MOOD_SCALES) {
    assert.match(scale.question, /\?$/, scale.id);
    assert.equal(scale.labels.length, 5, scale.id);
  }
});

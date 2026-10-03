import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTENTION_SCRIPTS,
  attentionScriptForDate,
  attentionScriptSeconds,
  attentionStepSeconds,
  isAttentionScriptId,
} from './attentionScripts.ts';

const scripts = Object.values(ATTENTION_SCRIPTS).flat();
const muscleReleases = ATTENTION_SCRIPTS['muscle-release'];

test('every script has steps with something to say', () => {
  for (const script of scripts) {
    assert.ok(script.steps.length > 0, `${script.id} has no steps`);
    for (const step of script.steps) {
      assert.ok(step.prompt.trim().length > 0, `${script.id} has an empty prompt`);
      assert.ok(step.nudge.trim().length > 0, `${script.id} has an empty nudge`);
    }
  }
});

test('script ids are unique and match their keys', () => {
  const ids = Object.values(ATTENTION_SCRIPTS).map((wordings) => wordings[0].id);
  assert.equal(new Set(ids).size, ids.length);
  for (const [key, wordings] of Object.entries(ATTENTION_SCRIPTS)) {
    assert.ok(wordings.length > 0, key);
    for (const script of wordings) assert.equal(script.id, key);
    assert.ok(isAttentionScriptId(key));
  }
  assert.equal(isAttentionScriptId('toString'), false);
  assert.equal(isAttentionScriptId(undefined), false);
});

test('a script runs for roughly the minutes it quotes', () => {
  for (const script of scripts) {
    const quoted = script.minutes * 60;
    const actual = attentionScriptSeconds(script);
    assert.ok(
      Math.abs(actual - quoted) <= quoted * 0.2,
      `${script.id} runs ${actual}s against a quoted ${quoted}s`,
    );
  }
});

test('timed steps run for a positive whole number of seconds', () => {
  for (const script of scripts) {
    for (const step of script.steps) {
      const seconds = step.kind === 'timed' ? step.seconds : step.estimatedSeconds;
      assert.ok(Number.isInteger(seconds) && seconds > 0, `${script.id}: ${step.prompt}`);
    }
  }
});

test('a script ends on a tap, so finishing is something the user chose', () => {
  for (const script of scripts) {
    assert.equal(script.steps.at(-1)?.kind, 'tap', script.id);
  }
});

test('muscle release squeezes each part for 5 seconds, then lets it go for 10', () => {
  for (const script of muscleReleases) {
    const steps = script.steps;
    const squeezes = steps.filter((step) => step.kind === 'timed' && step.phase === 'squeeze');
    assert.equal(squeezes.length, 5);
    for (const squeeze of squeezes) {
      assert.equal(squeeze.seconds, 5);
      const letGo = steps[steps.indexOf(squeeze) + 1];
      assert.equal(letGo.kind, 'timed');
      assert.equal(letGo.phase, 'release');
      assert.equal(letGo.seconds, 10);
      assert.equal(letGo.label, squeeze.label);
      assert.ok(squeeze.label, `${squeeze.prompt} has no body part`);
    }
    assert.ok(steps.some((step) => /sore/.test(step.nudge)), 'missing the safety line');
  }
});

test('muscle release runs for about two minutes', () => {
  for (const script of muscleReleases) {
    const seconds = attentionScriptSeconds(script);
    assert.ok(seconds >= 95 && seconds <= 120, `runs ${seconds}s`);
  }
});

test('muscle release has three wordings that differ only in words', () => {
  assert.equal(muscleReleases.length, 3);
  const rhythm = (script) =>
    script.steps.map((step) => [step.kind, step.phase, step.label, attentionStepSeconds(step)]);
  const [first, ...others] = muscleReleases;
  for (const other of others) {
    assert.equal(attentionScriptSeconds(other), attentionScriptSeconds(first));
    assert.deepEqual(rhythm(other), rhythm(first));
  }
  const prompts = new Set(muscleReleases.map((script) => script.steps[1].prompt));
  assert.equal(prompts.size, 3);
});

test('a session picks its wording from the date, a different one each day', () => {
  const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];
  const picked = days.map((day) => attentionScriptForDate('muscle-release', day));
  assert.equal(new Set(picked.slice(0, 3)).size, 3);
  assert.equal(picked[3], picked[0]);
  assert.equal(attentionScriptForDate('muscle-release', '2026-10-01'), picked[0]);
  assert.equal(attentionScriptForDate('muscle-release', 'not a date'), muscleReleases[0]);
  assert.equal(attentionScriptForDate('54321', '2026-10-02'), ATTENTION_SCRIPTS['54321'][0]);
});

test('5-4-3-2-1 counts down the senses with a dot for each thing named', () => {
  const counts = ATTENTION_SCRIPTS['54321'][0].steps.map((step) => step.count ?? null);
  assert.deepEqual(counts, [null, 5, 4, 3, 2, 1, null]);
});

test('labels are sentence case, never shouting', () => {
  for (const script of scripts) {
    for (const step of script.steps) {
      if (step.label == null) continue;
      assert.match(step.label, /^[A-Z0-9][^A-Z]*$/, step.label);
    }
  }
});

test('no user-facing copy uses banned words or em dashes', () => {
  for (const script of scripts) {
    const copy = [
      script.title,
      ...script.steps.flatMap((step) => [step.label ?? '', step.prompt, step.nudge]),
    ];
    for (const line of copy) {
      assert.doesNotMatch(line, /breathwork|exercise|—/i, line);
    }
  }
});

test('record_attention_session accepts exactly the scripts the app can play', async () => {
  const { readFileSync } = await import('node:fs');
  const sql = readFileSync(
    new URL(
      '../../../../supabase/migrations/20261002000200_attention_resets_count_like_breathing.sql',
      import.meta.url,
    ),
    'utf8',
  );
  const list = sql.match(/v_script_id not in \(([^)]*)\)/);
  assert.ok(list, 'record_attention_session no longer checks its script ids');
  const accepted = [...list[1].matchAll(/'([^']+)'/g)].map((match) => match[1]).sort();
  assert.deepEqual(accepted, Object.keys(ATTENTION_SCRIPTS).sort());
});

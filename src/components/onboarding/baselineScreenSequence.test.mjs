import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const screen = readFileSync(
  new URL('./screens/BaselineScreen.tsx', import.meta.url),
  'utf8',
);

test('a completed capture analyzes before revealing the BPM result', () => {
  assert.match(screen, /type Phase = [^;]*'analyzing'[^;]*'result'/);
  assert.match(
    screen,
    /onResultCaptured\(completedResult\);[\s\S]*?setResult\(completedResult\);[\s\S]*?setPhase\('analyzing'\)/,
  );
  assert.match(screen, /label="Heart reading"/);
  assert.match(screen, /durationMs=\{POST_READING_ANALYSIS_MS\}/);
  assert.match(screen, /onDone=\{\(\) => setPhase\('result'\)\}/);
});

test('an existing result restores the BPM result without re-analyzing', () => {
  assert.match(screen, /initialResult \? 'result' : 'intro'/);
  assert.match(
    screen,
    /useState<CompletedOnboardingBaselineResult \| null>\(initialResult\)/,
  );
});

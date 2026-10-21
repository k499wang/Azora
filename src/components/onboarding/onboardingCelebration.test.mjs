import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const pact = readFileSync(new URL('./screens/PactScreen.tsx', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./CelebrationOverlay.tsx', import.meta.url), 'utf8');

function confirm({ hasConfirmed = false, isSubmitting = false } = {}) {
  const events = [];
  const dependencies = {
    useCallback: (callback) => callback,
    hasConfirmed,
    isSubmitting,
    setHasConfirmed: (value) => events.push(['confirmed', value]),
    setStamped: (value) => events.push(['stamped', value]),
    setCelebrationFinished: (value) => events.push(['finished', value]),
    setCelebrating: (value) => events.push(['celebrating', value]),
    onConfirm: () => events.push(['save']),
  };
  const start = pact.indexOf('  const handleConfirm =');
  const end = pact.indexOf('\n  const handleSealLand', start);
  const javascript = ts.transpileModule(`${pact.slice(start, end)}\nreturn handleConfirm;`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function(...Object.keys(dependencies), javascript)(...Object.values(dependencies))();
  return events;
}

test('confirm shows success before starting the save without waiting for seal landing', () => {
  assert.deepEqual(confirm(), [
    ['confirmed', true], ['stamped', true], ['finished', false], ['celebrating', true], ['save'],
  ]);
  const landing = pact.slice(pact.indexOf('  const handleSealLand'), pact.indexOf('  const handleCelebrated'));
  assert.doesNotMatch(landing, /setCelebrating|setTimeout/);
});

test('a confirmed or submitting pact does not start another celebration or save', () => {
  assert.deepEqual(confirm({ hasConfirmed: true }), []);
  assert.deepEqual(confirm({ isSubmitting: true }), []);
});

test('success badge, check and title are visible without animation progress', () => {
  assert.match(overlay, /<View style=\{styles\.lip\}>/);
  assert.match(overlay, /<Path\s+d=\{CHECK_PATH\}/);
  assert.match(overlay, /<Text style=\{styles\.title\}>\{title\}<\/Text>/);
  assert.doesNotMatch(overlay, /strokeDashoffset|strokeDasharray|RiseUnlessReducedMotion|overlayStyle|badgeStyle/);
});

test('completion uses the cleanup-owned frame timer and slow saves keep an explicit status', () => {
  assert.match(overlay, /useEffect\(\(\) => startUiTimer\(FINISHED_MS, \(\) => onFinishedRef\.current\?\.\(\)\), \[\]\)/);
  assert.match(pact, /statusMessage=\{celebrationFinished && isSubmitting \? 'Saving your plan…' : undefined\}/);
  assert.match(overlay, /accessibilityLiveRegion="polite"/);
});

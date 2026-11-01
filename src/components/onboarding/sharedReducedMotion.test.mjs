import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Execute the real effects without mounting SVG or native animation views.
function effectFrom(file, marker) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  let effect;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(tree) === 'useEffect'
      && node.arguments[0]?.getText(tree).includes(marker)) {
      effect = node.arguments[0].getText(tree);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.ok(effect, `Missing effect in ${file}`);
  return (dependencies) => new Function(...Object.keys(dependencies), `return (${effect})();`)(...Object.values(dependencies));
}

const runRadar = effectFrom('./MindMapRadar.tsx', 'const flippedOn');
const runCelebration = effectFrom('./CelebrationOverlay.tsx', 'const cancelLanding');

function radar({ reducedMotion, reduceMotion }) {
  const timers = new Map();
  const clock = { value: 0 }, kept = { value: 0 };
  let reveals = 0;
  const cleanup = runRadar({
    reducedMotion, reduceMotion, showTarget: true,
    wasShowingTarget: { current: false }, clock, kept,
    cornerCount: 5, growTotalMs: 1200, GROW_MS: 300,
    CORNER_STAGGER_MS: 100, CORNER_PEAK_MS: 200,
    easing: {}, Easing: { linear: 'linear' },
    withTiming: (to, config) => ({ to, config }),
    setReveals: (update) => { reveals = update(reveals); },
    triggerTapHaptic: () => {},
    startUiTimer: (delay, callback) => {
      timers.set(delay, callback);
      return () => timers.delete(delay);
    },
  });
  return { clock, kept, timers, cleanup, reveals };
}

test('standalone radar settles immediately without sparkle or corner haptic timers in reduced motion', () => {
  const result = radar({ reducedMotion: true, reduceMotion: 'system' });
  assert.equal(result.clock.value, 1200);
  assert.equal(result.kept.value, 1);
  assert.equal(result.reveals, 0);
  assert.equal(result.timers.size, 0);
});

test('onboarding radar animates every corner and cancels its haptic timers on teardown', () => {
  const result = radar({ reducedMotion: false, reduceMotion: 'never' });
  assert.equal(result.clock.value.config.reduceMotion, 'never');
  assert.equal(result.reveals, 1);
  assert.equal(result.timers.size, 5);
  result.cleanup();
  assert.equal(result.timers.size, 0);
});

test('standalone radar keeps System animation configuration when motion is enabled', () => {
  const result = radar({ reducedMotion: false, reduceMotion: 'system' });
  assert.equal(result.clock.value.config.reduceMotion, 'system');
  result.cleanup();
});

test('celebration suppresses its landing haptic and animation scheduling outside full motion', () => {
  for (const reducedMotion of [true, false]) {
    const timers = new Set(), animations = [];
    const animate = (...args) => { animations.push(args); return args; };
    const cleanup = runCelebration({
      reducedMotion, reduceMotion: reducedMotion ? 'system' : 'never',
      isHapticsEnabled: () => false,
      backdrop: {}, pop: {}, draw: {}, light: {},
      duration: {}, easing: {}, Easing: { out: (value) => value, cubic: 'cubic' },
      POP_AT_MS: 100, DRAW_AT_MS: 200, DRAW_MS: 100, LANDED_MS: 300,
      withTiming: animate, withDelay: animate, cancelAnimation: () => {},
      triggerHeavyHaptic: () => {},
      startUiTimer: (delay) => { timers.add(delay); return () => timers.delete(delay); },
    });
    assert.equal(timers.size, reducedMotion ? 0 : 1);
    assert.equal(animations.length > 0, !reducedMotion);
    cleanup?.();
    assert.equal(timers.size, 0);
  }
});

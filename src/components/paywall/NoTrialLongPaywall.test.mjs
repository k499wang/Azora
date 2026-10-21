import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./NoTrialLongPaywall.tsx', import.meta.url), 'utf8');
const entrance = source.slice(source.indexOf('  const fadeAnim ='), source.indexOf('  const heroHeight'));
const javascript = ts.transpileModule(entrance, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

function harness(initialStep) {
  const refs = [], animations = [];
  let layout = false, cursor = 0, ready = 0, cleanup;
  const dependencies = {
    initialStep,
    useRef(value) { const index = cursor++; return refs[index] ??= { current: value }; },
    useState: () => [layout, () => {}],
    useEffect: callback => { cleanup = callback(); },
    onReady: () => ready++,
    entranceTiming: { fade: 300 },
    ENTRANCE_EASING: {},
    Animated: {
      Value: class {},
      timing: () => {
        let completion;
        const animation = {
          start(callback) { completion = callback; },
          stop() { completion?.({ finished: false }); },
          complete(finished = true) { completion?.({ finished }); },
        };
        animations.push(animation);
        return animation;
      },
    },
  };
  const run = new Function(...Object.keys(dependencies), javascript);
  return {
    animations,
    ready: () => ready,
    render(hasLayout = layout) { layout = hasLayout; cursor = 0; run(...Object.values(dependencies)); },
    unmount() { cleanup?.(); },
  };
}

test('the long paywall reports ready only after layout and its successful root entrance', () => {
  const page = harness();
  page.render();
  assert.equal(page.animations.length, 0);
  assert.equal(page.ready(), 0);
  page.render(true);
  assert.equal(page.ready(), 0);
  page.animations[0].complete();
  page.animations[0].complete();
  assert.equal(page.ready(), 1);
  page.unmount();
});

test('canceled and late unmounted entrances cannot release the pact cover', () => {
  for (const unmount of [false, true]) {
    const page = harness();
    page.render(true);
    if (unmount) page.unmount();
    page.animations[0].complete(!unmount ? false : true);
    assert.equal(page.ready(), 0);
  }
});

test('a direct plan reports ready on layout without adding a second entrance', () => {
  const page = harness('plan');
  page.render();
  assert.equal(page.ready(), 0);
  page.render(true);
  assert.equal(page.ready(), 1);
  assert.equal(page.animations.length, 0);
});

test('the entrance fades the root canvas and close button together', () => {
  assert.match(source, /<Animated\.View\s+onLayout=\{\(\) => setHasLayout\(true\)\}\s+style=\{\[styles\.screen, \{ opacity: fadeAnim \}\]\}/);
  assert.match(source, /<View style=\{styles\.body\}>/);
  assert.equal((source.match(/opacity: fadeAnim/g) ?? []).length, 1);
});

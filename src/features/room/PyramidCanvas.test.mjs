import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

// Exercise the component's placement handshake with JS and UI commits kept
// separate, as they are on a device (Reanimated's synchronous mock hides this).
const source = readFileSync(new URL('./PyramidCanvas.tsx', import.meta.url), 'utf8');
const placement = source.slice(
  source.indexOf('  const [placedOnce, setPlacedOnce]'),
  source.indexOf('  // Measured at zero opacity'),
);

function mount() {
  let visible = false;
  let readyCalls = 0;
  let reaction;
  let previous = null;
  const queued = [];
  const reported = { current: false };
  const placed = { value: false };
  const render = () => vm.runInNewContext(placement, {
    placed,
    onReady: () => { readyCalls++; },
    useState: () => [visible, (value) => { visible = value; }],
    useRef: () => reported,
    useCallback: (callback) => callback,
    useAnimatedReaction: (prepare, react) => { reaction = () => {
      const value = prepare();
      react(value, previous);
      previous = value;
    }; },
    runOnJS: (callback) => () => { queued.push(callback); },
  });
  return {
    render,
    commitUI() { reaction(); },
    flushJS() { while (queued.length) queued.shift()(); },
    placed,
    get visible() { return visible; },
    get readyCalls() { return readyCalls; },
  };
}

test('Azo stays unmounted until the UI thread confirms the hotel transform', () => {
  const canvas = mount();
  // Measuring the hotel and running JS effects can precede the UI commit.
  canvas.render();
  canvas.commitUI();
  canvas.flushJS();
  assert.equal(canvas.visible, false);
  assert.equal(canvas.readyCalls, 0);

  canvas.placed.value = true;
  canvas.commitUI();
  assert.equal(canvas.visible, false);
  canvas.flushJS();
  assert.equal(canvas.visible, true);
  assert.equal(canvas.readyCalls, 1);
});

test('rerendering with a new ready callback does not report placement twice', () => {
  const canvas = mount();
  canvas.render();
  canvas.placed.value = true;
  canvas.commitUI();
  canvas.flushJS();
  canvas.render();
  canvas.commitUI();
  // Also cover a restarted reaction scheduling a duplicate notification.
  canvas.placed.value = false;
  canvas.commitUI();
  canvas.placed.value = true;
  canvas.commitUI();
  canvas.flushJS();
  assert.equal(canvas.readyCalls, 1);
});

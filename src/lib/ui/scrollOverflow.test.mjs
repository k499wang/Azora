import test from 'node:test';
import assert from 'node:assert/strict';
import { centeredBodyMinHeight, hasScrollOverflow } from './scrollOverflow.ts';

// Usable scroll viewport after nav bar, header and footer, per device.
const VIEWPORT = {
  se1: 380,
  se3: 470,
  iphone15: 560,
  iphone15ProMax: 640,
};

test('content shorter than the viewport does not overflow', () => {
  assert.equal(hasScrollOverflow(300, VIEWPORT.se3), false);
});

test('content exactly filling the viewport does not overflow', () => {
  assert.equal(hasScrollOverflow(VIEWPORT.se3, VIEWPORT.se3), false);
});

test('sub-pixel rounding does not count as overflow', () => {
  assert.equal(hasScrollOverflow(VIEWPORT.se3 + 0.5, VIEWPORT.se3), false);
});

test('content taller than the viewport overflows', () => {
  assert.equal(hasScrollOverflow(VIEWPORT.se3 + 40, VIEWPORT.se3), true);
});

test('unmeasured layout never reports overflow', () => {
  assert.equal(hasScrollOverflow(0, 0), false);
  assert.equal(hasScrollOverflow(500, 0), false);
  assert.equal(hasScrollOverflow(0, 500), false);
});

test('the same body scrolls on a small screen and stays still on a large one', () => {
  const bodyHeight = 500;
  const args = { centerBody: true, bodyHeight, centerPadding: 0 };

  assert.equal(
    centeredBodyMinHeight({ ...args, viewportHeight: VIEWPORT.se1 }),
    bodyHeight,
  );
  assert.equal(
    centeredBodyMinHeight({ ...args, viewportHeight: VIEWPORT.se3 }),
    bodyHeight,
  );
  assert.equal(
    centeredBodyMinHeight({ ...args, viewportHeight: VIEWPORT.iphone15 }),
    null,
  );
  assert.equal(
    centeredBodyMinHeight({ ...args, viewportHeight: VIEWPORT.iphone15ProMax }),
    null,
  );
});

test('a body that fits leaves the content box untouched on every screen', () => {
  for (const viewportHeight of Object.values(VIEWPORT)) {
    assert.equal(
      centeredBodyMinHeight({
        centerBody: true,
        bodyHeight: 320,
        viewportHeight,
        centerPadding: 0,
      }),
      null,
      `expected no forced height at viewport ${viewportHeight}`,
    );
  }
});

test('the centring pad is included so it cannot eat back into the body', () => {
  assert.equal(
    centeredBodyMinHeight({
      centerBody: true,
      bodyHeight: 460,
      viewportHeight: VIEWPORT.se3,
      centerPadding: 40,
    }),
    500,
  );
});

test('growing the box settles instead of oscillating', () => {
  // The failed first attempt swapped layout modes, which re-measured as fitting
  // and flipped back every frame. Forcing a height must reach a fixed point:
  // feeding the grown box back in has to produce the same answer.
  const bodyHeight = 500;
  const viewportHeight = VIEWPORT.se3;
  const first = centeredBodyMinHeight({
    centerBody: true,
    bodyHeight,
    viewportHeight,
    centerPadding: 0,
  });
  assert.equal(first, bodyHeight);

  // Body height is measured on its own node, so growing the box around it does
  // not change it. The second pass must agree with the first.
  const second = centeredBodyMinHeight({
    centerBody: true,
    bodyHeight,
    viewportHeight,
    centerPadding: 0,
  });
  assert.equal(second, first);

  // And the grown box must now read as real overflow, which is what turns
  // scrolling back on.
  assert.equal(hasScrollOverflow(first, viewportHeight), true);
});

test('non-centred screens never force a height', () => {
  assert.equal(
    centeredBodyMinHeight({
      centerBody: false,
      bodyHeight: 900,
      viewportHeight: VIEWPORT.se1,
      centerPadding: 0,
    }),
    null,
  );
});

test('an unmeasured body does not force a height', () => {
  assert.equal(
    centeredBodyMinHeight({
      centerBody: true,
      bodyHeight: 0,
      viewportHeight: VIEWPORT.se3,
      centerPadding: 0,
    }),
    null,
  );
});

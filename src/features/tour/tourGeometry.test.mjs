import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arrowOffsetX,
  inflate,
  isOnScreen,
  placeCluster,
  scrollOffsetFor,
} from './tourGeometry.ts';

const viewport = { safeLeft: 0, safeRight: 390, safeTop: 60, safeBottom: 700 };
const CLUSTER = 170;
const GAP = 12;

test('inflate grows the rect evenly on every side', () => {
  const grown = inflate({ x: 20, y: 100, width: 200, height: 80 }, 8);
  assert.deepEqual(grown, { x: 12, y: 92, width: 216, height: 96 });
});

test('stands below the element when there is room below', () => {
  const hole = { x: 0, y: 100, width: 300, height: 120 };
  const placement = placeCluster(hole, viewport, CLUSTER, GAP);
  assert.equal(placement.pointsDown, false);
  assert.equal(placement.top, 232);
});

test('stands above when the element is too low for room below', () => {
  const hole = { x: 0, y: 500, width: 300, height: 160 };
  const placement = placeCluster(hole, viewport, CLUSTER, GAP);
  assert.equal(placement.pointsDown, true);
  assert.equal(placement.top, 318);
});

test('never places the cluster outside the safe area', () => {
  // An element taller than the viewport leaves room on neither side.
  const hole = { x: 0, y: 20, width: 300, height: 900 };
  const placement = placeCluster(hole, viewport, CLUSTER, GAP);
  assert.ok(placement.top >= viewport.safeTop);
  assert.ok(placement.top + CLUSTER <= viewport.safeBottom);
  assert.equal(placement.height, CLUSTER);
});

test('shrinks the cluster predictably when the safe viewport is too short', () => {
  const shortViewport = { safeLeft: 0, safeRight: 390, safeTop: 100, safeBottom: 220 };
  const placement = placeCluster(
    { x: 0, y: 120, width: 300, height: 60 },
    shortViewport,
    CLUSTER,
    GAP,
  );

  assert.equal(placement.top, shortViewport.safeTop);
  assert.equal(placement.height, 120);
  assert.equal(placement.top + placement.height, shortViewport.safeBottom);
});

test('picks the roomier side when neither side fits the cluster', () => {
  const hole = { x: 0, y: 300, width: 300, height: 260 };
  const placement = placeCluster(hole, viewport, CLUSTER, GAP);
  // 228 above vs 128 below — above wins, so the arrow points down.
  assert.equal(placement.pointsDown, true);
});

test('scroll offset brings the element to the desired top', () => {
  assert.equal(scrollOffsetFor({ x: 0, y: 500, width: 1, height: 1 }, 200, 180), 520);
});

test('scroll offset never goes past the top of the list', () => {
  assert.equal(scrollOffsetFor({ x: 0, y: 40, width: 1, height: 1 }, 0, 180), 0);
});

test('arrow points at the centre of a wide element', () => {
  // 390pt screen, cluster inset 16 each side => 358 wide.
  const hole = { x: 16, y: 300, width: 358, height: 120 };
  assert.equal(arrowOffsetX(hole, 16, 358, 40), 159);
});

test('arrow follows a right-aligned control instead of the screen centre', () => {
  const hole = { x: 290, y: 300, width: 76, height: 32 };
  assert.equal(arrowOffsetX(hole, 16, 358, 40), 292);
});

test('arrow never leaves the cluster', () => {
  const offScreenRight = { x: 900, y: 300, width: 40, height: 32 };
  assert.equal(arrowOffsetX(offScreenRight, 16, 358, 40), 318);

  const offScreenLeft = { x: -200, y: 300, width: 40, height: 32 };
  assert.equal(arrowOffsetX(offScreenLeft, 16, 358, 40), 0);
});

test('an element inside the viewport is on screen', () => {
  assert.equal(isOnScreen({ x: 0, y: 300, width: 300, height: 120 }, viewport, 40), true);
});

test('an element scrolled far below the fold is not on screen', () => {
  assert.equal(isOnScreen({ x: 0, y: 1400, width: 300, height: 120 }, viewport, 40), false);
});

test('an element scrolled above the viewport is not on screen', () => {
  assert.equal(isOnScreen({ x: 0, y: -400, width: 300, height: 120 }, viewport, 40), false);
});

test('a partly visible element still counts when enough of it shows', () => {
  // 60 of its 120 sits below safeTop.
  assert.equal(isOnScreen({ x: 0, y: 0, width: 300, height: 120 }, viewport, 40), true);
});

test('an element shorter than the minimum only needs to be fully visible', () => {
  assert.equal(isOnScreen({ x: 0, y: 300, width: 80, height: 20 }, viewport, 40), true);
});

test('zero and negative dimensions are never visible', () => {
  assert.equal(isOnScreen({ x: 20, y: 300, width: 80, height: 0 }, viewport, 40), false);
  assert.equal(isOnScreen({ x: 20, y: 300, width: 0, height: 80 }, viewport, 40), false);
  assert.equal(isOnScreen({ x: 20, y: 300, width: -1, height: 80 }, viewport, 40), false);
  assert.equal(isOnScreen({ x: 20, y: 300, width: 80, height: -1 }, viewport, 40), false);
});

test('an element outside either horizontal edge is not on screen', () => {
  assert.equal(isOnScreen({ x: 500, y: 300, width: 80, height: 80 }, viewport, 40), false);
  assert.equal(isOnScreen({ x: -120, y: 300, width: 80, height: 80 }, viewport, 40), false);
});

test('a partly visible horizontal element needs the minimum intersection', () => {
  assert.equal(isOnScreen({ x: -40, y: 300, width: 80, height: 80 }, viewport, 40), true);
  assert.equal(isOnScreen({ x: -41, y: 300, width: 80, height: 80 }, viewport, 40), false);
});

test('a viewport-tall element is usable only while it intersects the viewport', () => {
  assert.equal(isOnScreen({ x: 20, y: -200, width: 300, height: 1200 }, viewport, 40), true);
  assert.equal(isOnScreen({ x: 20, y: -1300, width: 300, height: 1200 }, viewport, 40), false);
});

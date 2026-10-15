import assert from 'node:assert/strict';
import test from 'node:test';
import { decorationPickerLayout } from './decorationPickerLayout.ts';

test('the picker row reserves its well, two label lines, tile border and padding', () => {
  for (const windowWidth of [320, 360, 390, 430, 744, 1024]) {
    const layout = decorationPickerLayout(windowWidth, 18, 1.25);
    const tileHeight = layout.wellSize + 36 + 4 + (8 + 1.25) * 2;

    assert.equal(layout.rowHeight, tileHeight + 4 * 2, `width ${windowWidth}`);
    assert.equal(layout.labelHeight, 36);
    assert.equal(layout.wellSize, layout.tileWidth - 16);
    assert.ok(layout.rowHeight > 0);
  }
});

test('phone options stay responsive and tablet options retain the picker cap', () => {
  const small = decorationPickerLayout(320, 18, 1.25);
  const phone = decorationPickerLayout(390, 18, 1.25);
  const tablet = decorationPickerLayout(744, 18, 1.25);

  assert.equal(small.tileWidth, (320 - 36) / 3.2);
  assert.ok(phone.tileWidth > small.tileWidth);
  assert.equal(tablet.tileWidth, 112);
  assert.deepEqual(decorationPickerLayout(1024, 18, 1.25), tablet);
});

test('the shared row grows with the app typography while keeping the artwork size', () => {
  const phoneType = decorationPickerLayout(744, 18, 1.25);
  const tabletType = decorationPickerLayout(744, 20, 1.25);

  assert.equal(tabletType.wellSize, phoneType.wellSize);
  assert.equal(tabletType.rowHeight - phoneType.rowHeight, 4);
});

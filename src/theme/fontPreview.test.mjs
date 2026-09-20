import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTIVE_FONT_PREVIEW, fontPreviewNames, resolveFontPreview } from './fontPreview.ts';

test('keeps the code-selected preview limited to a supported candidate', () => {
  assert.ok(fontPreviewNames.includes(ACTIVE_FONT_PREVIEW));
});

test('selects Fredoka with regular body copy and deliberately softer emphasis weights', () => {
  const preview = resolveFontPreview('fredoka');

  assert.equal(preview.name, 'fredoka');
  assert.deepEqual(
    [preview.roles.light.weight, preview.roles.regular.weight, preview.roles.medium.weight, preview.roles.semibold.weight, preview.roles.bold.weight],
    ['400', '400', '500', '500', '600'],
  );
  assert.equal(preview.roles.light.family, 'Fredoka-Regular');
});

test('falls back to the active font preview for invalid selections', () => {
  assert.equal(resolveFontPreview('comic-sans').name, ACTIVE_FONT_PREVIEW);
});

test('uses the requested font when it is a supported candidate', () => {
  assert.equal(resolveFontPreview('outfit').name, 'outfit');
});

test('maps Outfit to its original semantic weights', () => {
  const preview = resolveFontPreview('outfit');

  assert.deepEqual(
    Object.values(preview.roles).map(({ weight }) => weight),
    ['300', '400', '500', '600', '600', '800'],
  );
});

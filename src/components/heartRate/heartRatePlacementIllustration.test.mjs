import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const illustration = readFileSync(
  new URL('./HeartRatePlacementIllustration.tsx', import.meta.url),
  'utf8',
);
const imageCache = readFileSync(
  new URL('../../services/images/onboardingImageCache.ts', import.meta.url),
  'utf8',
);
const carousel = readFileSync(
  new URL('../onboarding/baseline/HeartRatePlacementCarousel.tsx', import.meta.url),
  'utf8',
);

test('each body shape draws its own camera photo', () => {
  const bodies = [
    ['single', 'cameraPlacementSingle', 'camera-placement-single.webp'],
    ['dual', 'cameraPlacementDual', 'camera-placement-dual.webp'],
    ['triple', 'cameraPlacementTriple', 'camera-placement-triple.webp'],
  ];

  for (const [layout, key, file] of bodies) {
    assert.match(illustration, new RegExp(`${layout}: '${key}'`));
    assert.match(
      imageCache,
      new RegExp(
        `${key}: require\\('\\.\\.\\/\\.\\.\\/\\.\\.\\/assets\\/onboarding\\/${file.replace('.', '\\.')}'\\)`,
      ),
    );
    assert.match(imageCache, new RegExp(`${key}: \\{ maxWidth: 870 \\}`));
  }

  // A one-lens phone is a body we have art for, not a text stand-in.
  assert.doesNotMatch(illustration, /'single'\) return null/);
  assert.match(
    illustration,
    /cameraProfile\.layout === 'unknown'[\s\S]*?The live camera check will show you which lens to cover\./,
  );
});

test('the square photo is drawn square, at the size its caller gives it', () => {
  assert.match(illustration, /aspectRatio: 1/);
  assert.doesNotMatch(illustration, /aspectRatio: 1\.82/);
  // The carousel's art box is square too, so the photo fills it like its siblings.
  assert.match(carousel, /<HeartRatePlacementIllustration size=\{VISUAL_SIZE\} \/>/);
});

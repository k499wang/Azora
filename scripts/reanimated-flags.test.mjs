import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const { reanimated } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('native animation styles remain registered after settling without the delayed React collector', () => {
  const flags = reanimated.staticFeatureFlags;
  assert.equal(flags.FORCE_REACT_RENDER_FOR_SETTLED_ANIMATIONS, false);
  assert.equal(flags.IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS, true);
  assert.equal(flags.ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS, true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AUDIO_PREFERENCES,
  parseStoredAudioPreferences,
  sanitizeAudioPreferences,
} from './audioPreferencesCore.ts';

test('legacy singing bowl is removed while current valid fields are preserved', () => {
  const result = parseStoredAudioPreferences(JSON.stringify({
    voice: null,
    ambient: null,
    chime: 'singingBowl',
    ambientVolume: 0.8,
    themeId: 'sage',
  }));

  assert.deepEqual(result.preferences, {
    soundEffects: true,
    voice: null,
    ambient: null,
    ambientVolume: 0.8,
    themeId: 'sage',
  });
  assert.equal(Object.hasOwn(result.preferences, 'chime'), false);
  assert.equal(result.shouldPersist, true);
});

test('legacy null chime still requests a canonical rewrite', () => {
  const result = parseStoredAudioPreferences(JSON.stringify({
    voice: null,
    ambient: null,
    chime: null,
    ambientVolume: 0.5,
    themeId: 'light',
  }));

  assert.equal(result.shouldPersist, true);
  assert.equal(Object.hasOwn(result.preferences, 'chime'), false);
});

test('a valid current payload does not request a rewrite', () => {
  const result = parseStoredAudioPreferences(JSON.stringify({
    soundEffects: false,
    voice: null,
    ambient: null,
    ambientVolume: 0.25,
    themeId: 'slate',
  }));

  assert.deepEqual(result, {
    preferences: {
      soundEffects: false,
      voice: null,
      ambient: null,
      ambientVolume: 0.25,
      themeId: 'slate',
    },
    shouldPersist: false,
  });
});

test('existing preferences enable sound effects and request a migration', () => {
  const result = parseStoredAudioPreferences(JSON.stringify({
    voice: null,
    ambient: null,
    ambientVolume: 0.7,
    themeId: 'sage',
  }));

  assert.deepEqual(result.preferences, {
    soundEffects: true,
    voice: null,
    ambient: null,
    ambientVolume: 0.7,
    themeId: 'sage',
  });
  assert.equal(result.shouldPersist, true);
  assert.equal(
    parseStoredAudioPreferences(JSON.stringify(result.preferences)).shouldPersist,
    false,
  );
});

test('invalid sound effects values use the enabled default', () => {
  for (const soundEffects of [null, 'false', 0, {}, []]) {
    const result = parseStoredAudioPreferences(JSON.stringify({
      ...DEFAULT_AUDIO_PREFERENCES,
      soundEffects,
    }));
    assert.equal(result.preferences.soundEffects, true);
    assert.equal(result.shouldPersist, true);
  }
});

test('sound effects opt-out survives migration while voice and ambient stay off', () => {
  const result = parseStoredAudioPreferences(JSON.stringify({
    ...DEFAULT_AUDIO_PREFERENCES,
    soundEffects: false,
    voice: 'theo',
    ambient: 'rain',
  }));

  assert.deepEqual(result.preferences, {
    ...DEFAULT_AUDIO_PREFERENCES,
    soundEffects: false,
  });
  assert.equal(result.shouldPersist, true);
});

test('missing and malformed storage use defaults and request persistence', () => {
  assert.deepEqual(parseStoredAudioPreferences(null), {
    preferences: DEFAULT_AUDIO_PREFERENCES,
    shouldPersist: true,
  });
  assert.deepEqual(parseStoredAudioPreferences('{not-json'), {
    preferences: DEFAULT_AUDIO_PREFERENCES,
    shouldPersist: true,
  });
});

test('serialized migrated preferences omit the legacy chime key', () => {
  const result = parseStoredAudioPreferences(JSON.stringify({
    voice: null,
    ambient: null,
    chime: 'singingBowl',
    ambientVolume: 0.6,
    themeId: 'stone',
  }));

  assert.equal(JSON.stringify(result.preferences).includes('chime'), false);
});

test('invalid preference fields sanitize safely and request a rewrite', () => {
  const raw = {
    voice: 'theo',
    ambient: 'rain',
    ambientVolume: 4,
    themeId: 'unknown',
  };

  assert.deepEqual(sanitizeAudioPreferences(raw), DEFAULT_AUDIO_PREFERENCES);
  assert.deepEqual(parseStoredAudioPreferences(JSON.stringify(raw)), {
    preferences: DEFAULT_AUDIO_PREFERENCES,
    shouldPersist: true,
  });
});

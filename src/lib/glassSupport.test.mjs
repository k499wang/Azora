import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveGlassMode } from './glassSupport.ts';

test('iOS with both capability flags resolves to liquid glass', () => {
  assert.equal(
    resolveGlassMode({
      platform: 'ios',
      liquidGlassAvailable: true,
      glassApiAvailable: true,
    }),
    'liquid',
  );
});

test('iOS without liquid glass falls back to blur', () => {
  assert.equal(
    resolveGlassMode({
      platform: 'ios',
      liquidGlassAvailable: false,
      glassApiAvailable: true,
    }),
    'blur',
  );
});

test('iOS with liquid available but API unavailable falls back to blur', () => {
  assert.equal(
    resolveGlassMode({
      platform: 'ios',
      liquidGlassAvailable: true,
      glassApiAvailable: false,
    }),
    'blur',
  );
});

test('Android always resolves to a solid scrim, never blur', () => {
  assert.equal(
    resolveGlassMode({
      platform: 'android',
      liquidGlassAvailable: true,
      glassApiAvailable: true,
    }),
    'solid',
  );
});

test('forceFallback downgrades a glass-capable iOS device to blur', () => {
  assert.equal(
    resolveGlassMode({
      platform: 'ios',
      liquidGlassAvailable: true,
      glassApiAvailable: true,
      forceFallback: true,
    }),
    'blur',
  );
});

test('forceFallback on Android stays solid', () => {
  assert.equal(
    resolveGlassMode({
      platform: 'android',
      liquidGlassAvailable: true,
      glassApiAvailable: true,
      forceFallback: true,
    }),
    'solid',
  );
});

test('reduceTransparency downgrades the blur fallback to solid', () => {
  assert.equal(
    resolveGlassMode({
      platform: 'ios',
      liquidGlassAvailable: false,
      glassApiAvailable: true,
      reduceTransparency: true,
    }),
    'solid',
  );
});

test('reduceTransparency leaves native liquid glass to the OS', () => {
  assert.equal(
    resolveGlassMode({
      platform: 'ios',
      liquidGlassAvailable: true,
      glassApiAvailable: true,
      reduceTransparency: true,
    }),
    'liquid',
  );
});

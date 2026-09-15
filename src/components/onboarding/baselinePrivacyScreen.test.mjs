import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(
  new URL('./screens/BaselinePrivacyScreen.tsx', import.meta.url),
  'utf8',
);

test('baseline privacy screen explains the camera reading and user control', () => {
  assert.match(source, /We take your privacy and security seriously/);
  assert.match(source, /rear camera and flash/);
  assert.match(source, /subtle color changes in your fingertip/);
  assert.match(source, /processed on your device/);
  assert.match(source, /does not save photos or\s+raw camera video/);
  assert.match(source, /may be used to personalize your\s+Azora experience/);
  assert.match(source, /skip the reading and continue onboarding/);
  assert.match(source, /Measure later/);
});

test('privacy policy is an accessible link to Azora policy', () => {
  assert.match(source, /accessibilityRole="link"/);
  assert.match(source, /accessibilityLabel="Open Azora Privacy Policy"/);
  assert.match(source, /https:\/\/www\.tryazora\.app\/privacy/);
});

test('screen avoids unsupported privacy and compliance claims', () => {
  assert.doesNotMatch(
    source,
    /encrypt|anonymous|anonymiz|share(?:d|s|ing)?|retain|retention|HIPAA|GDPR|compliant|compliance/i,
  );
  assert.match(source, /accessibilityRole="checkbox"/);
  assert.match(source, /disabled=\{!hasConsented\}/);
});

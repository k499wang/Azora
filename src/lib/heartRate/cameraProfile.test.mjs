import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getHeartRateCameraProfile,
  getHeartRatePhysicalCamera,
} from './cameraProfile.ts';

const expectedProfiles = [
  ['iPhone 16', 'dual', 'bottom camera'],
  ['iPhone 16 Plus', 'dual', 'bottom camera'],
  ['iPhone 16 Pro', 'triple', 'rightmost camera'],
  ['iPhone 16 Pro Max', 'triple', 'rightmost camera'],
  ['iPhone 17 Pro', 'triple', 'rightmost camera'],
  ['iPhone 17 Pro Max', 'triple', 'rightmost camera'],
];

test('known iPhone models resolve to their matching camera profile', () => {
  for (const [modelName, layout, target] of expectedProfiles) {
    const profile = getHeartRateCameraProfile(modelName);
    assert.equal(profile.layout, layout, modelName);
    assert.equal(profile.target, target, modelName);
  }
});

test('unknown and unavailable models keep the safe wide camera fallback', () => {
  for (const modelName of ['iPhone 15', 'Pixel 9', null]) {
    const profile = getHeartRateCameraProfile(modelName);
    assert.equal(profile.layout, 'unknown');
    assert.equal(profile.target, 'camera lens');
    assert.equal(profile.title, 'Cover the camera lens');
  }
});

test('every supported triple-camera iPhone selects the telephoto camera', () => {
  const tripleCameraModels = [
    'iPhone 11 Pro',
    'iPhone 11 Pro Max',
    'iPhone 12 Pro',
    'iPhone 12 Pro Max',
    'iPhone 13 Pro',
    'iPhone 13 Pro Max',
    'iPhone 14 Pro',
    'iPhone 14 Pro Max',
    'iPhone 15 Pro',
    'iPhone 15 Pro Max',
    'iPhone 16 Pro',
    'iPhone 16 Pro Max',
    'iPhone 17 Pro',
    'iPhone 17 Pro Max',
  ];

  for (const modelName of tripleCameraModels) {
    assert.equal(
      getHeartRatePhysicalCamera(modelName),
      'telephoto-camera',
      modelName,
    );
  }
});

test('base, Plus, mini, Air, unknown, and unavailable models select wide angle', () => {
  const wideCameraModels = [
    'iPhone 11',
    'iPhone 12',
    'iPhone 12 mini',
    'iPhone 13',
    'iPhone 13 mini',
    'iPhone 14',
    'iPhone 14 Plus',
    'iPhone 15',
    'iPhone 15 Plus',
    'iPhone 16',
    'iPhone 16 Plus',
    'iPhone 17',
    'iPhone Air',
    'Pixel 9 Pro',
    null,
  ];

  for (const modelName of wideCameraModels) {
    assert.equal(
      getHeartRatePhysicalCamera(modelName),
      'wide-angle-camera',
      modelName ?? 'null',
    );
  }
});

test('older Pro camera selection does not change its generic placement profile', () => {
  for (const modelName of ['iPhone 11 Pro', 'iPhone 15 Pro Max']) {
    const profile = getHeartRateCameraProfile(modelName);
    assert.equal(profile.layout, 'unknown', modelName);
    assert.equal(profile.target, 'camera lens', modelName);
    assert.equal(profile.title, 'Cover the camera lens', modelName);
  }
});

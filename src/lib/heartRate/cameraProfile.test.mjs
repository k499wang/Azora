import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeartRateCameraProfile } from './cameraProfile.ts';

const expectedProfiles = [
  ['iPhone 16', 'dual', 'wide-angle-camera', 'bottom camera'],
  ['iPhone 16 Plus', 'dual', 'wide-angle-camera', 'bottom camera'],
  ['iPhone 16 Pro', 'triple', 'telephoto-camera', 'rightmost camera'],
  ['iPhone 16 Pro Max', 'triple', 'telephoto-camera', 'rightmost camera'],
  ['iPhone 17 Pro', 'triple', 'telephoto-camera', 'rightmost camera'],
  ['iPhone 17 Pro Max', 'triple', 'telephoto-camera', 'rightmost camera'],
];

test('known iPhone models resolve to their matching camera profile', () => {
  for (const [modelName, layout, physicalCamera, target] of expectedProfiles) {
    const profile = getHeartRateCameraProfile(modelName);
    assert.equal(profile.layout, layout, modelName);
    assert.equal(profile.physicalCamera, physicalCamera, modelName);
    assert.equal(profile.target, target, modelName);
  }
});

test('unknown and unavailable models keep the safe wide camera fallback', () => {
  for (const modelName of ['iPhone 15', 'Pixel 9', null]) {
    const profile = getHeartRateCameraProfile(modelName);
    assert.equal(profile.layout, 'unknown');
    assert.equal(profile.physicalCamera, 'wide-angle-camera');
    assert.equal(profile.target, 'camera lens');
    assert.equal(profile.title, 'Cover the camera lens');
  }
});

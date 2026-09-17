import test from 'node:test';
import assert from 'node:assert/strict';
import { useFirstSessionActivationStore as store } from './firstSessionActivationStore.ts';

function running(userId = 'activation-user') {
  store.setState({ userId, phase: 'running', techniqueId: 'box', followsTour: true });
}

test('same-account readiness checks and hydration preserve the running session', () => {
  running();
  store.getState().beginCheck('activation-user');
  store.getState().hydrate('activation-user', 'box', true);
  assert.equal(store.getState().phase, 'running');
});

test('a new account checks its own saved activation and ignores old hydration', () => {
  running();
  store.getState().beginCheck('other-user');
  store.getState().hydrate('activation-user', 'box', true);
  assert.equal(store.getState().phase, 'checking');
  store.getState().hydrate('other-user', null, true);
  assert.equal(store.getState().phase, 'inactive');
  assert.equal(store.getState().userId, 'other-user');
});

test('skipping while persistence is pending cannot resurrect result coaching', async () => {
  running();
  const pending = store.getState().completePersistence();
  store.getState().skip();
  await pending;
  assert.equal(store.getState().phase, 'inactive');
});

test('completion from the previous account cannot replace the new account state', async () => {
  running();
  const pending = store.getState().completePersistence();
  store.getState().beginCheck('other-user');
  store.getState().hydrate('other-user', 'other-technique', true);
  await pending;
  assert.equal(store.getState().phase, 'daily');
  assert.equal(store.getState().techniqueId, 'other-technique');
});

test('onboarding queue survives the app owner checking and hydrating it', async () => {
  await store.getState().prepareQueued('onboarding-user', 'box');
  store.getState().beginCheck('onboarding-user');
  store.getState().hydrate('onboarding-user', 'box', false);
  assert.equal(store.getState().phase, 'queued');
  store.getState().promoteQueued();
  assert.equal(store.getState().phase, 'daily');
});

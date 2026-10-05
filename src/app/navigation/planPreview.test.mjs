import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CommonActions, StackRouter } from '@react-navigation/routers';

test('finished-plan preview is ignored in release builds and cannot start a plan', () => {
  const source = readFileSync(new URL('../../screens/InsightsScreen.tsx', import.meta.url), 'utf8');
  const expression = source.match(/const previewFinishedPlan = ([^;]+);/)[1];
  const previewEnabled = new Function('__DEV__', 'route', `return ${expression};`);
  const requested = { params: { previewFinishedPlan: true } };
  assert.equal(previewEnabled(false, requested), false);
  assert.equal(previewEnabled(true, requested), true);
  assert.equal(previewEnabled(true, {}), false);
  assert.match(source, /onStart=\{\(planId\) => \{\s*if \(previewFinishedPlan\) return;\s*startPlan\.mutate/);
});

test('repeated Plan lab previews return to the existing main tabs', () => {
  const source = readFileSync(new URL('../../screens/PlanLabScreen.tsx', import.meta.url), 'utf8');
  assert.match(source, /screen: 'Insights',[\s\S]*?previewFinishedPlan: true[\s\S]*?\{ pop: true \}/);
  const router = StackRouter({});
  const options = {
    routeNames: ['MainTabs', 'Settings', 'PlanLab'],
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = router.getInitialState(options);
  for (let cycle = 0; cycle < 10; cycle += 1) {
    for (const action of [
      CommonActions.navigate('Settings'),
      CommonActions.navigate('PlanLab'),
      CommonActions.navigate('MainTabs', {
        screen: 'Insights', params: { previewFinishedPlan: true },
      }, { pop: true }),
    ]) {
      state = router.getStateForAction(state, action, options);
      assert.ok(state);
    }
    assert.deepEqual(state.routes.map((route) => route.name), ['MainTabs']);
    assert.equal(state.routes[0].params.params.previewFinishedPlan, true);
  }
});

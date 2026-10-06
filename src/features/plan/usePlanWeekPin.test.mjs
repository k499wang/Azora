import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  let state;
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL('./usePlanWeekPin.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return {
        useCallback: (callback) => callback,
        useMemo: (create) => create(),
        useState(initial) {
          state ??= initial;
          return [state, (update) => { state = update(state); }];
        },
      };
      if (name === 'react-native-reanimated') return {
        useSharedValue: (value) => ({ value }),
      };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return (planId) => exports.usePlanWeekPin({ value: 0 }, 100, planId);
}

test('a new plan waits for fresh measurements even if the previous plan had more weeks', () => {
  const render = setup();
  let pin = render('long');
  for (let week = 1; week <= 6; week++) pin.measureWeek(week, 140);
  pin = render('long');
  assert.equal(pin.measuredWeekCount, 6);
  assert.equal(pin.bannerHeight, 140);

  pin = render('short');
  assert.equal(pin.measuredWeekCount, 0);
  assert.equal(pin.bannerHeight, 0);
  pin.measureWeek(1, 90);
  pin = render('short');
  assert.equal(pin.measuredWeekCount, 1);
  assert.equal(pin.bannerHeight, 90);
  pin.measureWeek(2, 110);
  pin = render('short');
  assert.equal(pin.measuredWeekCount, 2);
  assert.equal(pin.bannerHeight, 110);
});

test('progress rerenders retain measurements and changes in text layout update the maximum', () => {
  const render = setup();
  let pin = render('same');
  pin.measureWeek(1, 90);
  pin.measureWeek(2, 120);
  pin = render('same');
  assert.equal(pin.measuredWeekCount, 2);
  assert.equal(pin.bannerHeight, 120);
  pin.measureWeek(2, 100);
  pin = render('same');
  assert.equal(pin.measuredWeekCount, 2);
  assert.equal(pin.bannerHeight, 100);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { ICON_PATHS } from '../../components/common/icons/paths.ts';
import { dayCoinIcon } from './pathCoinIcon.ts';
import { allProgramPresets } from '../program/domain/programCatalogue.ts';

test('every published plan has a distinct, renderable motif for every day', () => {
  for (const preset of allProgramPresets()) {
    const icons = preset.days.map((day) => dayCoinIcon(preset, day.day));
    assert.equal(new Set(icons).size, preset.days.length, `${preset.planId} repeats a day motif`);
    for (const icon of icons) {
      assert.ok(Object.hasOwn(ICON_PATHS, icon), `${preset.planId}: ${icon} cannot render`);
    }
    const bodies = icons.map((icon) => {
      const path = ICON_PATHS[icon];
      return typeof path === 'string' ? path : path.body;
    });
    assert.equal(new Set(bodies).size, icons.length, `${preset.planId} reuses an identical glyph`);
  }
});

test('day motifs are deterministic across presets and independent of repeated practices', () => {
  const motifsByDay = new Map();
  for (const preset of allProgramPresets()) {
    for (const day of preset.days) {
      const icon = dayCoinIcon(preset, day.day);
      assert.equal(dayCoinIcon(preset, day.day), icon);
      assert.equal(motifsByDay.get(day.day) ?? icon, icon);
      motifsByDay.set(day.day, icon);
      const changedPractices = { ...preset, days: [{ ...day, activityIds: [] }] };
      assert.equal(dayCoinIcon(changedPractices, day.day), icon);
    }
  }
});

test('unavailable presets and days retain the star fallback', () => {
  const preset = allProgramPresets()[0];
  assert.equal(dayCoinIcon(null, 1), 'coin-star');
  for (const day of [0, -1, 1.5, 999, NaN]) {
    assert.equal(dayCoinIcon(preset, day), 'coin-star');
  }
});

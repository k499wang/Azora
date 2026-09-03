import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  breakpoints,
  contentColumn,
  dashboardContentColumn,
  groupedContentColumn,
  hasDashboardColumns,
} from '../../theme/breakpoints';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..');

function read(relativePath) {
  return readFileSync(join(src, relativePath), 'utf8');
}

test('content measures grow with information density, not device size', () => {
  assert.equal(contentColumn.maxWidth, 480);
  assert.equal(groupedContentColumn.maxWidth, 680);
  assert.equal(dashboardContentColumn.maxWidth, 800);
  assert.ok(
    contentColumn.maxWidth < groupedContentColumn.maxWidth &&
      groupedContentColumn.maxWidth < dashboardContentColumn.maxWidth,
  );
});

test('dashboard card rows activate only when three useful columns fit', () => {
  assert.equal(breakpoints.regularWidth, 600);
  assert.equal(breakpoints.dashboardColumnsWidth, 800);
  assert.equal(hasDashboardColumns(799), false);
  assert.equal(hasDashboardColumns(800), true);
});

test('ScreenContent keeps focused width by default and exposes semantic variants', () => {
  const content = read('components/common/ScreenContent.tsx');

  assert.match(content, /width = 'focused'/);
  assert.match(content, /ScreenContentWidth = 'focused' \| 'grouped' \| 'dashboard'/);
  assert.match(content, /focused: contentColumn/);
  assert.match(content, /grouped: groupedContentColumn/);
  assert.match(content, /dashboard: dashboardContentColumn/);
});

test('card-heavy screens opt into the appropriate tablet measure', () => {
  const home = read('screens/HomeScreen.tsx');
  const heart = read('screens/HeartTabScreen.tsx');
  const detail = read('screens/HeartRateSessionDetailScreen.tsx');
  const profile = read('screens/ProfileScreen.tsx');
  const history = read('screens/HistoryScreen.tsx');
  const settings = read('screens/SettingsScreen.tsx');

  assert.match(home, /useDashboardLayout\(\)/);
  assert.match(heart, /<ScreenContent width="dashboard">/);
  assert.match(detail, /<ScreenContent width="dashboard">/);
  assert.match(profile, /<ScreenContent width="dashboard">/);
  assert.match(history, /<ScreenContent\s+width="grouped"/);
  assert.match(settings, /<ScreenContent width="grouped">/);
});

test('Home, Heart and Profile share one tablet margin', () => {
  const layout = read('hooks/useDashboardLayout.ts');
  const home = read('screens/HomeScreen.tsx');
  const heart = read('screens/HeartTabScreen.tsx');
  const profile = read('screens/ProfileScreen.tsx');

  // One measure and one inset, so switching tabs never moves the edge.
  assert.match(layout, /padding\.screen\.horizontal;/);
  for (const screen of [home, heart, profile]) {
    assert.match(screen, /useDashboardLayout\(\)/);
  }
});

test('a tablet draws a taller daily than a phone', () => {
  const dailies = read('components/home/TodaysDailiesSection.tsx');

  assert.match(dailies, /useIsRegularWidth\(\)\s*\?\s*REGULAR_ROW_METRICS/);
  const compact = /COMPACT_ROW_METRICS: DailyRowMetrics = \{\s*expandedHeight: (\d+)/.exec(dailies);
  const regular = /REGULAR_ROW_METRICS: DailyRowMetrics = \{\s*expandedHeight: (\d+)/.exec(dailies);
  assert.ok(Number(regular[1]) > Number(compact[1]));
});

test('only peer Heart summaries become rows while charts stay outside them', () => {
  const heart = read('screens/HeartTabScreen.tsx');
  const heartRate = read('components/heartRate/HeartRateStatsSection.tsx');
  const hrv = read('components/heartRate/HRVStatsSection.tsx');

  assert.match(heart, /useSummaryRow={dashboardLayout\.hasColumns}/);
  assert.match(heartRate, /useSummaryRow && styles\.summaryRow/);
  assert.match(hrv, /useSummaryRow && styles\.summaryRow/);
  assert.doesNotMatch(heart, /numColumns|flexWrap/);
});

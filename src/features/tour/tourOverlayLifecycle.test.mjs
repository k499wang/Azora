import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

test('TourOverlay owns settled measurement and layout watching as one lifecycle', () => {
  const overlay = readFileSync(join(here, 'TourOverlay.tsx'), 'utf8');
  const ownerStart = overlay.indexOf('// Measure, publish, and then watch');
  const ownerEnd = overlay.indexOf('const presentedStep', ownerStart);
  const owner = overlay.slice(ownerStart, ownerEnd);

  assert.notEqual(ownerStart, -1);
  assert.notEqual(ownerEnd, -1);
  assert.equal(owner.match(/useLayoutEffect\(\(\) => \{/g)?.length, 1);
  assert.doesNotMatch(owner, /useEffect\(\(\) => \{/);
  assert.equal(owner.match(/watchTourTargetLayout\(/g)?.length, 1);
  assert.doesNotMatch(overlay, /measurementGenerationRef|layoutGenerationRef/);

  assert.match(
    owner,
    /const isCurrentStep = \(\) =>\s*isActive && useTourStore\.getState\(\)\.stepIndex === measuringIndex/,
  );
  assert.match(
    owner,
    /current\?\.stepIndex === measuringIndex \? null : current/,
  );

  const initialMeasure = owner.indexOf('void measureTourTarget(');
  const initialGuard = owner.indexOf('if (!isCurrentStep()) return;', initialMeasure);
  const initialPublish = owner.indexOf(
    'setPositionedRect({ stepIndex: measuringIndex, rect: measured });',
    initialGuard,
  );
  const startWatching = owner.indexOf('unwatch = watchTourTargetLayout(', initialPublish);
  assert.ok(initialMeasure < initialGuard);
  assert.ok(initialGuard < initialPublish);
  assert.ok(initialPublish < startWatching);

  assert.match(owner, /let latestRequestId = 0/);
  assert.match(owner, /const requestId = \+\+latestRequestId/);
  assert.match(owner, /requestId !== latestRequestId/);
  assert.match(
    owner,
    /if \(unwatch == null\) return;[\s\S]*?latestRequestId \+= 1;[\s\S]*?unwatch = null;[\s\S]*?stop\(\)/,
  );
  assert.match(
    owner,
    /stopWatching\(\);\s*clearCurrentRect\(\);\s*retryOrAdvance\(\);/,
  );
  assert.match(
    owner,
    /return \(\) => \{\s*isActive = false;\s*stopWatching\(\);/,
  );

  assert.match(overlay, /const hasPositionedRect = rect != null/);
  assert.match(
    overlay,
    /\[clusterOpacity, hasPositionedRect, reducedMotion\]/,
  );
  assert.doesNotMatch(overlay, /\[rect, clusterOpacity, reducedMotion\]/);
});

test('the dailies tour target highlights the dailies without the progress card', () => {
  const home = readFileSync(
    join(here, '..', '..', 'screens', 'HomeScreen.tsx'),
    'utf8',
  );
  const targetMarker = '<View {...dailiesTarget}>';
  const targetStart = home.indexOf(targetMarker);
  const targetEnd = home.indexOf('</View>', targetStart);
  const target = home.slice(targetStart, targetEnd);

  assert.equal(home.split(targetMarker).length - 1, 1);
  assert.notEqual(targetStart, -1);
  assert.notEqual(targetEnd, -1);
  assert.ok(home.indexOf('<RoomProgressCard') < targetStart);
  assert.match(target, /<TodaysDailiesSection/);
  assert.doesNotMatch(target, /<RoomProgressCard/);
});

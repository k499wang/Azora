import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..');

function read(relativePath) {
  return readFileSync(join(src, relativePath), 'utf8');
}

test('every screenshot fixture shares the explicit development opt-in', () => {
  const fixture = read('features/home/devHomeScreenshotData.ts');

  assert.match(fixture, /function isDevScreenshotDataEnabled/);
  assert.match(fixture, /!__DEV__/);
  assert.match(
    fixture,
    /process\.env\.EXPO_PUBLIC_HOME_SCREENSHOT_DATA !== 'true'/,
  );
  assert.equal(
    (fixture.match(/if \(!isDevScreenshotDataEnabled\(\)\) return null;/g) ?? [])
      .length,
    4,
  );
});

test('Hotel screenshot data is a twelve-floor route-only fallback', () => {
  const fixture = read('features/home/devHomeScreenshotData.ts');
  const hotel = read('screens/HotelScreen.tsx');
  const productStart = hotel.indexOf('export default function HotelScreen');
  const previewStart = hotel.indexOf('export function HotelPreviewScreen');
  const product = hotel.slice(productStart, previewStart);
  const preview = hotel.slice(previewStart);

  assert.match(fixture, /export function getDevHotelScreenshotData/);
  assert.match(fixture, /Array\.from\({ length: 12 }/);
  assert.match(fixture, /if \(floor === 12\)/);
  assert.match(fixture, /DAYS\.slice\(0, SCREENSHOT_DECORATION_COUNT\)/);
  assert.match(hotel, /override \?\? screenshotRooms \?\? realRooms/);
  assert.match(
    hotel,
    /roomsQuery\.isPending && override == null && screenshotRooms == null/,
  );
  assert.match(product, /screenshotRooms={getDevHotelScreenshotData\(\)}/);
  assert.doesNotMatch(preview, /getDevHotelScreenshotData/);
});

test('Heart keeps its real query graph but prefers unlocked screenshot data', () => {
  const heart = read('screens/HeartTabScreen.tsx');

  assert.equal((heart.match(/useHeartRateStatsQuery\(/g) ?? []).length, 1);
  assert.equal((heart.match(/useProfileQuery\(/g) ?? []).length, 1);
  assert.match(
    heart,
    /const stats = screenshotData\?\.stats \?\? heartRateStatsQuery\.data/,
  );
  assert.match(
    heart,
    /const advancedStatsLocked =\s*screenshotData == null &&/,
  );
  assert.match(
    heart,
    /age={screenshotData\?\.age \?\? profileQuery\.data\?\.age \?\? null}/,
  );
  assert.match(
    heart,
    /isLoading={\s*screenshotData == null && heartRateStatsQuery\.isLoading\s*}/,
  );
});

test('Profile screenshot identity cannot open or perform profile mutations', () => {
  const profile = read('screens/ProfileScreen.tsx');

  assert.equal((profile.match(/useProfileSummaryQuery\(/g) ?? []).length, 1);
  assert.equal((profile.match(/useHomeStatsQuery\(/g) ?? []).length, 1);
  assert.match(
    profile,
    /screenshotData\?\.profileSummary \?\? profileSummaryQuery\.data/,
  );
  assert.match(profile, /screenshotData\?\.homeStats \?\? homeStatsQuery\.data/);
  assert.match(
    profile,
    /onChangePhoto={\s*screenshotData == null\s*\? handleChangePhoto\s*: ignoreScreenshotIdentityAction\s*}/,
  );
  assert.match(
    profile,
    /visible={screenshotData == null && editingDisplayName}/,
  );
  assert.match(profile, /showStreak={screenshotData == null}/);
  assert.match(
    profile,
    /<TopBarStreak streakDays={profileSummary\?\.currentStreak \?\? 0} \/>/,
  );
  assert.match(
    profile,
    /const advancedStatsLocked =\s*screenshotData == null &&/,
  );
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..');

function read(relativePath) {
  return readFileSync(join(src, relativePath), 'utf8');
}

test('Home owns See all navigation and places extra practice after dailies', () => {
  const home = read('screens/HomeScreen.tsx');

  assert.match(
    home,
    /<HomeRoom[\s\S]*?<RoomProgressCard[\s\S]*?<TodaysDailiesSection[\s\S]*?\/>[\s\S]*?<ExtraPracticeSection[\s\S]*?onSeeAll={\(\) => navigation\.navigate\('Explore'\)}/,
  );
  assert.doesNotMatch(home, /splitRow|splitDailiesColumn|flexDirection:\s*'row'/);
});

test('the extra practice section reuses card behavior without query observers', () => {
  const section = read('components/home/ExtraPracticeSection.tsx');
  const techniqueCard = read('components/explore/TechniqueCard.tsx');
  const shelf = read('components/explore/TechniqueShelf.tsx');

  assert.doesNotMatch(
    section,
    /\buseNavigation\s*\(|\buseFeatureAccess\s*\(|\buseRecommendedTechnique\s*\(|\buseQuery\s*\(/,
  );
  assert.match(
    section,
    /<SectionHeader\s+icon="waves"\s+title="What are you feeling\?"/,
  );
  // The shared shelf owns the fixed card width and horizontal scrolling at
  // every window size, so Home and Explore cannot drift apart.
  assert.match(section, /<TechniqueShelf/);
  assert.match(shelf, /TECHNIQUE_SHELF_CARD_WIDTH/);
  assert.match(shelf, /<ScrollView\s+horizontal/);
  assert.match(section, /layout="shelf"/);
  assert.match(section, /sourceScreen="Home"/);
  assert.match(section, /sourceAction="extra_practice"/);
  assert.doesNotMatch(section, /compactShelf|COMPACT_TECHNIQUE/);
  assert.doesNotMatch(techniqueCard, /compactShelf|COMPACT_TECHNIQUE/);
});

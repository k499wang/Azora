import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const src = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The palette itself is the only place a brand blue may be written as a hex.
 *
 * Artwork needs no exemption: room, garden and mascot illustrations carry their
 * own bespoke tones and never land on a UI rung. If one ever does, it should
 * take the token or move off the ladder — which is the point. This guard exists
 * because `blue600` once survived a full token sweep hidden inside an SVG
 * gradient stop and a theme table, where no search for `colors.primary.*`
 * could see it.
 */
const PALETTE = 'theme/colors.ts';

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return ['.ts', '.tsx'].includes(extname(entry.name)) ? [path] : [];
  });
}

function uiSourceFiles() {
  return sourceFiles(src).filter((path) => relative(src, path) !== PALETTE);
}

test('UI code never writes a brand blue as a hex literal', () => {
  const ladder = Object.entries({
    blue100: '#E4F0FF',
    blue200: '#C2DDFF',
    blue300: '#94C6FF',
    blue400: '#63ADFF',
    blue500: '#3D93FF',
    blue600: '#1F7BFF',
    blue700: '#0F62E8',
    blue800: '#0C49B8',
    blue900: '#073388',
  });

  const offenders = uiSourceFiles().flatMap((path) => {
    const text = readFileSync(path, 'utf8');
    return ladder
      .filter(([, hex]) => text.toUpperCase().includes(hex))
      .map(([name]) => `${relative(src, path)} writes ${name} as a hex literal`);
  });

  assert.deepEqual(offenders, []);
});

test('the blue ladder in colors.ts stays evenly ordered from light to dark', () => {
  const palette = readFileSync(join(src, 'theme/colors.ts'), 'utf8');
  const ladder = [...palette.matchAll(/blue(\d00): '#([0-9A-F]{6})'/g)];

  assert.equal(ladder.length, 9, 'expected nine rungs');

  const luminance = ladder.map(([, , hex]) => {
    const channel = (offset) => {
      const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  });

  const descending = luminance.every(
    (value, index) => index === 0 || value < luminance[index - 1],
  );
  assert.ok(descending, `ladder is not monotonic: ${luminance.join(', ')}`);
});

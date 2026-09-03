import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', '..');
const root = join(src, '..');

function read(relativePath) {
  return readFileSync(join(src, relativePath), 'utf8');
}

/** every `name: { … }` / `name: \`…\`` entry in ICON_PATHS, with its body */
function iconEntries() {
  const file = read('components/common/icons/paths.ts');
  const start = file.indexOf('export const ICON_PATHS');
  const end = file.indexOf('} as const', start);
  const region = file.slice(start, end);
  const key = /^ {2}(?:'([a-zA-Z0-9-]+)'|([a-zA-Z0-9_]+)): /gm;
  const marks = [...region.matchAll(key)].map((match) => ({
    name: match[1] ?? match[2],
    at: match.index,
  }));

  return marks.map((mark, index) => ({
    name: mark.name,
    body: region.slice(mark.at, marks[index + 1]?.at ?? region.length),
  }));
}

function sourceFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.tsx?$/.test(entry)) files.push(path);
    }
  };
  walk(src);
  return files;
}

const DRAWS = /<(path|g|circle|rect|ellipse|polygon|polyline|line)\b/;

// An icon that ships as a placeholder comment renders as nothing at all, and
// nothing is exactly what a missing icon looks like on a card — no crash, no
// type error, just a gap where the mark should be. That is how five of these
// shipped drawing nothing, so the set is checked rather than trusted.
test('every icon in the set actually draws something', () => {
  const empty = iconEntries()
    .filter(({ body }) => !DRAWS.test(body.replace(/<!--[\s\S]*?-->/g, '')))
    .map(({ name }) => name);

  assert.deepEqual(empty, []);
});

test('every icon a component asks for is in the set', () => {
  const defined = new Set(iconEntries().map(({ name }) => name));
  const material = new Set(
    Object.keys(
      JSON.parse(
        readFileSync(
          join(
            root,
            'node_modules/@expo/vector-icons/build/vendor',
            'react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json',
          ),
          'utf8',
        ),
      ),
    ),
  );

  const missing = [];
  for (const file of sourceFiles()) {
    const text = readFileSync(file, 'utf8');
    for (const [, name] of text.matchAll(/<Icon\s+name="([a-zA-Z0-9-]+)"/g)) {
      if (!defined.has(name)) missing.push(`${file}: ${name}`);
    }
    // Icon names carried in data tables rather than written at the call site.
    for (const [, name] of text.matchAll(/icon: '([a-zA-Z0-9-]+)'/g)) {
      if (!defined.has(name) && !material.has(name)) {
        missing.push(`${file}: ${name}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});

test('every glyph shape has a body to draw', () => {
  const palette = read('features/exercise/guidedBreathing/categoryPalette.ts');
  const union = palette.match(/export type GlyphShape =([^;]+);/)[1];
  const declared = [...union.matchAll(/'([a-z]+)'/g)].map((match) => match[1]);

  const glyph = read('components/explore/ActivityGlyph.tsx');
  const drawn = new Set(
    [...glyph.matchAll(/case '([a-z]+)':/g)].map((match) => match[1]),
  );

  assert.deepEqual(
    declared.filter((shape) => !drawn.has(shape)),
    [],
  );
});

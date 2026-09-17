import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../../', import.meta.url));
const WRAPPER = 'components/common/Text.tsx';

function sourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const files = sourceFiles(SRC).map((full) => ({
  rel: relative(SRC, full).replaceAll('\\', '/'),
  code: readFileSync(full, 'utf8'),
}));

test('shared text renderers disable system font scaling by default', () => {
  const code = files.find(({ rel }) => rel === WRAPPER).code;
  for (const renderer of ['RNText', 'Animated.Text', 'RNTextInput']) {
    const openingTag = code.match(
      new RegExp(`<${renderer.replaceAll('.', '\\.')}\\s+([^>]*)>`, 's'),
    );
    assert.ok(openingTag, `Missing shared ${renderer} renderer`);
    assert.match(openingTag[1], /allowFontScaling\s*=\s*\{\s*false\s*\}/);
  }
});

/**
 * Dynamic Type is off app-wide, enforced in one place. Anything that renders
 * text outside that wrapper has to pin itself, or it grows alone on a screen
 * where nothing else does.
 */
test('text comes from the wrapper that pins font scaling', () => {
  const leaks = files.filter(({ rel, code }) => {
    if (rel === WRAPPER) return false;
    for (const match of code.matchAll(
      /import\s*\{([^}]*)\}\s*from\s*['"]react-native['"]/gs,
    )) {
      // `type TextInput` is a ref type, not a renderer.
      const values = match[1]
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name && !name.startsWith('type '))
        .map((name) => name.split(/\s+as\s+/)[0]);
      if (values.includes('Text') || values.includes('TextInput')) return true;
    }
    return false;
  });
  assert.deepEqual(leaks.map((f) => f.rel), []);
});

test('animated text pins font scaling at every call site', () => {
  const leaks = [];
  for (const { rel, code } of files) {
    if (rel === WRAPPER) continue;
    for (const match of code.matchAll(
      /<(?:Animated|Reanimated)\.Text\b([^>]*)>/gs,
    )) {
      if (!/allowFontScaling\s*=\s*\{\s*false\s*\}/.test(match[1])) leaks.push(rel);
    }
  }
  assert.deepEqual(leaks, []);
});

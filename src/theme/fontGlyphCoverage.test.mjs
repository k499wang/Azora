import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const src = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Every character the bundled faces are known to draw. Fredoka carries 320
 * glyphs and Balsamiq 979, so anything outside this set — an emoji, a check
 * mark, an arrow, a subscript — renders as tofu rather than falling back.
 * Icons belong in `components/common/icons/paths.ts`, not in a string.
 */
const SUPPORTED_NON_ASCII = new Set([
  '·', 'É', '×', 'è', 'é', '–', '—', '’', '“', '”', '•', '…', '‹', '›', '−',
]);

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (entry.name.includes('.test.')) return [];
    return ['.ts', '.tsx'].includes(extname(entry.name)) ? [path] : [];
  });
}

/** Comments carry em dashes by the hundred and never reach a screen. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (_, lead) => lead);
}

test('rendered strings stay inside the glyphs the bundled fonts carry', () => {
  const offenders = [];

  for (const file of sourceFiles(src)) {
    stripComments(readFileSync(file, 'utf8'))
      .split('\n')
      .forEach((line, index) => {
        for (const char of line) {
          if (char.codePointAt(0) < 128) continue;
          if (SUPPORTED_NON_ASCII.has(char)) continue;
          offenders.push(`${relative(src, file)}:${index + 1} ${char}`);
        }
      });
  }

  assert.deepEqual(offenders, []);
});

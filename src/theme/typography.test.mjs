import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const src = join(dirname(fileURLToPath(import.meta.url)), '..');

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return ['.ts', '.tsx'].includes(extname(entry.name)) ? [path] : [];
  });
}

test('shared text primitives apply the active regular face while preserving caller overrides', () => {
  const text = readFileSync(join(src, 'components/common/Text.tsx'), 'utf8');

  assert.match(text, /style=\{\[\{ fontFamily: fonts\.regular \}, style\]\}/);
  assert.equal(
    text.match(/style=\{\[\{ fontFamily: fonts\.regular \}, style\]\}/g)?.length,
    3,
  );
});

test('rendered text does not hard-code weights unsupported by the default face', () => {
  const unsupportedWeight = /fontWeight:\s*['"](?:100|200|300|500|600|800|900|bold|normal)['"]/;
  const offenders = sourceFiles(src).filter((path) =>
    unsupportedWeight.test(readFileSync(path, 'utf8')),
  );

  assert.deepEqual(offenders, []);
});

test('paywall title brand text uses the same bold face as its title', () => {
  const styles = readFileSync(
    join(src, 'components/onboarding/paywall/paywallStepStyles.ts'),
    'utf8',
  );
  const brandStyle = styles.match(/stepTitleBrand:\s*\{([^}]*)\}/)?.[1] ?? '';

  assert.match(brandStyle, /fontFamily:\s*fonts\.heavy/);
  assert.doesNotMatch(brandStyle, /fontWeight/);
  assert.doesNotMatch(brandStyle, /fontSize|lineHeight/);
});

test('paywall timeline labels keep their semibold face', () => {
  const styles = readFileSync(
    join(src, 'components/onboarding/paywall/paywallStepStyles.ts'),
    'utf8',
  );
  const timelineLabel = styles.match(/timelineLabel:\s*\{([^}]*)\}/)?.[1] ?? '';

  assert.match(timelineLabel, /fontFamily:\s*fonts\.semibold/);
  assert.doesNotMatch(timelineLabel, /fontWeight/);
});

test('call sites let semantic font faces own their supported weight', () => {
  const offenders = sourceFiles(src)
    .filter((path) => !path.endsWith('theme/typography.ts'))
    .filter((path) => /fontWeight\s*:/.test(readFileSync(path, 'utf8')));

  assert.deepEqual(offenders, []);
});

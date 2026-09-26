import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const aside = readFileSync(new URL('./AzoAside.tsx', import.meta.url), 'utf8');
const spotlight = readFileSync(
  new URL('../../features/tour/TourSpotlight.tsx', import.meta.url),
  'utf8',
);

// The tour hosts the bubble inside a row. A row child keeps its content width
// unless it may shrink, so a root that cannot shrink stops the bubble wrapping
// and runs the tour's longer lines off the screen.
test('the tour still hosts the bubble in a row, which is why its root must shrink', () => {
  assert.match(spotlight, /speech: \{[^}]*flexDirection: 'row'/);
});

test('the bubble root can shrink, so a row host squeezes it into wrapping', () => {
  const root = aside.match(/return \(\s*<View style=\{styles\.(\w+)\}/);
  assert.ok(root, 'AzoAside must render a styled root View');
  const style = aside.match(new RegExp(`\\n  ${root[1]}: \\{([^}]*)\\}`));
  assert.ok(style, `styles.${root[1]} must exist`);
  assert.match(style[1], /flexShrink: 1/);
});

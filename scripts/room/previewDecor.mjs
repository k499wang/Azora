// Renders room decorations to PNG for a look without a device:
//   node --loader ./scripts/resolve-extensionless-ts.mjs scripts/room/previewDecor.mjs <outDir> [dayN ...]
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [outDir, ...days] = process.argv.slice(2);
const wanted = days.length ? days : ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'];
mkdirSync(outDir, { recursive: true });

const { ROOM_DECOR } = await import('../../src/features/room/decor/index.ts');
const { previewShell } = await import('./previewShell.mjs');

const svgPolys = (polys) =>
  polys
    .map(
      (q) =>
        `<polygon points="${q.p}" fill="${q.f ?? 'none'}" opacity="${q.o ?? 1}" stroke="${q.s ?? 'none'}" stroke-width="${q.w ?? 0}" stroke-linejoin="round"/>`,
    )
    .join('');

const keys = Object.keys(ROOM_DECOR).filter((k) => wanted.some((day) => k.startsWith(day + '.')));
for (const k of keys) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="804" height="804" viewBox="-201 -201 402 402">${svgPolys(previewShell())}${svgPolys(ROOM_DECOR[k])}</svg>`;
  const file = join(outDir, `${k}.svg`);
  writeFileSync(file, svg);
  execFileSync('qlmanage', ['-t', '-s', '804', '-o', outDir, file], { stdio: 'ignore' });
  console.log(`${file}.png`);
}

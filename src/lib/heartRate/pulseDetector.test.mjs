import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

async function importPulseDetector() {
  const sourcePath = new URL('./pulseDetector.ts', import.meta.url);
  const source = await readFile(sourcePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: false,
    },
  });
  const dir = await mkdtemp(path.join(tmpdir(), 'azora-pulse-detector-'));
  const outputPath = path.join(dir, 'pulseDetector.mjs');
  await writeFile(outputPath, compiled.outputText);
  return import(pathToFileURL(outputPath).href);
}

test('pulse detector stores stable beat periods after repeated down-up cycles', async () => {
  const { PulseDetector } = await importPulseDetector();
  const detector = new PulseDetector();

  let t = 0;
  for (let i = 0; i < 4; i++) {
    detector.addNewValue(-1, t += 100);
    detector.addNewValue(1, t += 700);
  }

  const average = detector.getAverage();
  assert.equal(average > 0.3 && average < 0.5, true);
});

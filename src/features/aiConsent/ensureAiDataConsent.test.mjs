import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('./ensureAiDataConsent.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup(stored, answer) {
  const opened = [];
  const saved = [];
  const exports = {};
  const dependencies = {
    '../../services/preferences/aiDataConsentPreference': {
      loadAiDataConsent: async () => stored,
      saveAiDataConsent: async (userId) => { saved.push(userId); },
    },
  };
  vm.runInNewContext(code, {
    exports,
    require: (name) => dependencies[name],
    Promise,
    setTimeout: (callback) => callback(),
  });
  const navigation = {
    navigate(route) {
      opened.push(route);
      queueMicrotask(() => exports.settleAiDataConsent(answer));
    },
  };
  return { exports, ensure: (userId) => exports.ensureAiDataConsent(userId, navigation), navigation, opened, saved };
}

test('a recorded yes does not open the sheet again', async () => {
  const { ensure, opened } = setup(true);
  assert.equal(await ensure('user-1'), true);
  assert.deepEqual(opened, []);
});

test('first use opens the sheet and only Allow is remembered', async () => {
  const allow = setup(false, true);
  assert.equal(await allow.ensure('user-1'), true);
  assert.deepEqual(allow.opened, ['AiDataConsent']);
  assert.deepEqual(allow.saved, ['user-1']);

  const declined = setup(false, false);
  assert.equal(await declined.ensure('user-1'), false);
  assert.deepEqual(declined.saved, []);
});

test('no signed-in user means no consent and no sheet', async () => {
  const { ensure, opened } = setup(false, true);
  assert.equal(await ensure(null), false);
  assert.deepEqual(opened, []);
});

test('the preview records nothing, and a second question ends the first as a no', async () => {
  const harness = setup(false, true);
  harness.navigation.navigate = (route) => harness.opened.push(route);
  const first = harness.exports.askAiDataConsent(harness.navigation);
  const second = harness.exports.askAiDataConsent(harness.navigation);
  assert.equal(await first, false);
  harness.exports.settleAiDataConsent(true);
  assert.equal(await second, true);
  assert.deepEqual(harness.saved, []);
});

test('the sheet names Google Gemini and the data, and swiping away is a no', () => {
  const sheet = readFileSync(new URL('./AiDataConsentScreen.tsx', import.meta.url), 'utf8');
  const policy = readFileSync(new URL('./aiPolicy.ts', import.meta.url), 'utf8');
  assert.match(policy, /What you type or say to Azo, your to-do list, and any photo you choose/);
  assert.match(policy, /Google Gemini, a third-party AI service/);
  assert.match(policy, /We save your messages to Azo/);
  assert.match(policy, /encrypted in transit and at rest/);
  assert.match(policy, /not end-to-end encryption/);
  assert.match(sheet, /useEffect\(\(\) => \(\) => settleAiDataConsent\(answer\.current\), \[\]\)/);
  assert.match(sheet, /useRef\(false\)/);
});

test('both AI call sites wait for consent before sending anything', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.match(
    read('../azoAssist/useAzoAssist.ts'),
    /const ask = async[\s\S]{0,120}if \(!\(await ensureAiDataConsent\(userId, navigation\)\)\) return null;[\s\S]{0,120}await askAzo\(/,
  );
  assert.match(
    read('../photoCleanup/PhotoCleanupScreen.tsx'),
    /const generatePlan = useCallback\(async[\s\S]{0,200}await ensureAiDataConsent\(userId, navigation\)[\s\S]{0,300}await createPhotoCleanupPlan\(/,
  );
});

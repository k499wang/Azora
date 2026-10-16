import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, readFileSync, statSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const script = readFileSync(new URL('./prepare-qualified-trials-env.mjs', import.meta.url), 'utf8');
const backendRelativePath = 'artifacts/qualified-trial-dashboard/backend-secrets.env';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'azora-backend-secrets-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'scripts'));
  writeFileSync(join(root, 'scripts/prepare-qualified-trials-env.mjs'), script);
  writeFileSync(join(root, '.env'), 'EXPO_PUBLIC_APPSFLYER_DEV_KEY=fixture-key\nEXPO_PUBLIC_APPSFLYER_APP_ID=id123456789\n');
  return {
    root,
    output: join(root, backendRelativePath),
    run() { return execFileSync(process.execPath, [join(root, 'scripts/prepare-qualified-trials-env.mjs')], { encoding: 'utf8' }); },
  };
}

test('backend credentials stay outside Expo root dotenv discovery and survive repeated preparation', (t) => {
  const f = fixture(t);
  f.run();
  assert.equal(existsSync(join(f.root, '.env.qualified-trials.local')), false);
  assert.equal(/^\.env/.test(backendRelativePath), false);
  const original = readFileSync(f.output, 'utf8');
  const values = parseEnv(original);
  assert.equal(values.APPSFLYER_DEV_KEY, 'fixture-key');
  assert.equal(values.APPSFLYER_IOS_APP_ID, 'id123456789');
  assert.match(values.QUALIFIED_TRIAL_CRON_SECRET, /^[0-9a-f]{64}$/);
  assert.equal(values.REVENUECAT_SECRET_API_KEY, '');
  assert.equal(statSync(f.output).mode & 0o777, 0o600);
  f.run();
  assert.equal(readFileSync(f.output, 'utf8'), original);
});

test('legacy root secrets migrate without replacing their configured values', (t) => {
  const f = fixture(t);
  const legacy = join(f.root, '.env.qualified-trials.local');
  const contents = 'REVENUECAT_SECRET_API_KEY=fixture-only\nQUALIFIED_TRIAL_CRON_SECRET=existing-fixture-token\n';
  writeFileSync(legacy, contents, { mode: 0o600 });
  f.run();
  assert.equal(existsSync(legacy), false);
  assert.equal(readFileSync(f.output, 'utf8'), contents);
  assert.equal(statSync(f.output).mode & 0o777, 0o600);
});

test('Metro excludes backend artifacts while preserving ordinary app modules and public environment loading', () => {
  const config = require('../metro.config.js');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const blocked = (relative) => config.resolver.blockList.some((pattern) => pattern.test(join(root, relative)));
  assert.equal(blocked(backendRelativePath), true);
  assert.equal(blocked('artifacts/qualified-trial-dashboard/index.ts'), true);
  assert.equal(blocked('src/services/subscriptions/revenueCatClient.ts'), false);
  assert.equal(blocked('index.ts'), false);
  assert.equal(blocked('.env'), false);
  assert.equal(blocked('.env.local'), false);
});

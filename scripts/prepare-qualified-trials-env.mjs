import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const root = new URL('../', import.meta.url);
const directory = new URL('artifacts/qualified-trial-dashboard/', root);
const output = new URL('backend-secrets.env', directory);
const legacy = new URL('.env.qualified-trials.local', root);

// Expo's development loader includes every root .env* file as a module.
// Keep backend credentials outside that context and outside Metro's file map.
mkdirSync(directory, { recursive: true });
if (existsSync(legacy)) {
  if (existsSync(output)) {
    throw new Error('Both backend secret files exist; preserve their values and resolve the legacy root file before continuing.');
  }
  renameSync(legacy, output);
  chmodSync(output, 0o600);
  console.log('Moved backend credentials to artifacts/qualified-trial-dashboard/backend-secrets.env; values preserved.');
  process.exit(0);
}
if (existsSync(output)) {
  console.log(`${fileURLToPath(output)} already exists; its credentials were preserved.`);
  process.exit(0);
}
const mobile = parseEnv(readFileSync(new URL('.env', root), 'utf8'));
const devKey = mobile.EXPO_PUBLIC_APPSFLYER_DEV_KEY;
const appId = mobile.EXPO_PUBLIC_APPSFLYER_APP_ID;

if (!devKey || !/^id\d+$/.test(appId ?? '')) {
  throw new Error('Configure the AppsFlyer dev key and id-prefixed iOS app ID in .env first.');
}

const contents = [
  '# Private backend configuration. This file is ignored by Git.',
  '# Fill in a RevenueCat SECRET API key; the public mobile SDK key cannot return live attributes.',
  'REVENUECAT_SECRET_API_KEY=',
  `QUALIFIED_TRIAL_CRON_SECRET=${randomBytes(32).toString('hex')}`,
  `APPSFLYER_DEV_KEY=${JSON.stringify(devKey)}`,
  `APPSFLYER_IOS_APP_ID=${appId}`,
  '# APPSFLYER_ANDROID_APP_ID=com.azora.breath',
  '',
].join('\n');

try {
  writeFileSync(output, contents, { flag: 'wx', mode: 0o600 });
  console.log('Created artifacts/qualified-trial-dashboard/backend-secrets.env using the existing AppsFlyer configuration.');
  console.log('Fill in REVENUECAT_SECRET_API_KEY, then follow docs/analytics/qualified-trial-setup.md.');
} catch (error) {
  if (error?.code !== 'EEXIST') throw error;
  console.log(`${fileURLToPath(output)} already exists; its credentials were preserved.`);
}

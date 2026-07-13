import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');
const packageLock = require('../package-lock.json');
const easConfig = require('../eas.json');

const PROFILE_NAME = 'production';
const EXPECTED_BUNDLE_ID = 'com.azora.breath';
const REQUIRED_ENV = [
  'ANALYTICS_ENV',
  'POSTHOG_PROJECT_TOKEN',
  'POSTHOG_HOST',
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_APPSFLYER_DEV_KEY',
  'EXPO_PUBLIC_APPSFLYER_APP_ID',
];
const FORBIDDEN_BUILD_ENV = [
  'META_APP_ID',
  'META_APP_SECRET',
  'META_DATASET_ID',
  'EXPO_PUBLIC_FORCE_GLASS_MODE',
  'EXPO_PUBLIC_FORCE_GLASS_FALLBACK',
];

function fail(message) {
  console.error(`iOS production configuration error: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

const profile = easConfig.build?.[PROFILE_NAME];
assert(profile != null, 'eas.json is missing build.production.');
assert(
  profile.environment === PROFILE_NAME,
  'build.production.environment must be "production".',
);
assert(profile.autoIncrement === true, 'build.production.autoIncrement must be true.');
assert(
  easConfig.cli?.appVersionSource === 'remote',
  'cli.appVersionSource must be "remote" so App Store build numbers remain unique.',
);
assert(
  profile.developmentClient !== true && profile.distribution !== 'internal',
  'the production profile must be a store build, not a development/internal build.',
);

const profileEnv = profile.env ?? {};
const missing = REQUIRED_ENV.filter((name) => !isNonEmpty(profileEnv[name]));
assert(missing.length === 0, `missing variables: ${missing.join(', ')}.`);
assert(profileEnv.ANALYTICS_ENV === 'production', 'ANALYTICS_ENV must be "production".');
assert(
  /^phc_[A-Za-z0-9]+$/.test(profileEnv.POSTHOG_PROJECT_TOKEN),
  'POSTHOG_PROJECT_TOKEN has an unexpected format.',
);
assert(isHttpsUrl(profileEnv.POSTHOG_HOST), 'POSTHOG_HOST must be an HTTPS URL.');
assert(
  /^appl_[A-Za-z0-9]+$/.test(profileEnv.EXPO_PUBLIC_REVENUECAT_IOS_KEY),
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY has an unexpected format.',
);
assert(
  isHttpsUrl(profileEnv.EXPO_PUBLIC_SUPABASE_URL),
  'EXPO_PUBLIC_SUPABASE_URL must be an HTTPS URL.',
);
assert(
  /^sb_publishable_[A-Za-z0-9_-]+$/.test(
    profileEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY has an unexpected format.',
);
assert(
  /^id\d+$/.test(profileEnv.EXPO_PUBLIC_APPSFLYER_APP_ID),
  'EXPO_PUBLIC_APPSFLYER_APP_ID must use Apple\'s id123456789 format.',
);
assert(
  profileEnv.POSTHOG_PROJECT_TOKEN !==
    easConfig.build?.development?.env?.POSTHOG_PROJECT_TOKEN,
  'production and development must use different PostHog projects.',
);

for (const [profileName, buildProfile] of Object.entries(easConfig.build ?? {})) {
  const forbidden = FORBIDDEN_BUILD_ENV.filter(
    (name) => buildProfile?.env?.[name] != null,
  );
  assert(
    forbidden.length === 0,
    `build.${profileName}.env contains forbidden client/dashboard variables: ${forbidden.join(', ')}.`,
  );
}

const environmentNames = ['development', 'preview', 'production'];
for (const environmentName of environmentNames) {
  assert(
    easConfig.build?.[environmentName]?.environment === environmentName,
    `build.${environmentName}.environment must be "${environmentName}".`,
  );
  assert(
    easConfig.build?.[environmentName]?.env?.ANALYTICS_ENV === environmentName,
    `build.${environmentName}.env.ANALYTICS_ENV must be "${environmentName}".`,
  );
}

for (const name of [...REQUIRED_ENV, 'EXPO_PUBLIC_SUPABASE_ANON_KEY']) {
  if (profileEnv[name] == null) {
    delete process.env[name];
  } else {
    process.env[name] = profileEnv[name];
  }
}
for (const name of FORBIDDEN_BUILD_ENV) {
  delete process.env[name];
}
process.env.EAS_BUILD = 'true';
process.env.EAS_BUILD_PROFILE = PROFILE_NAME;
process.env.EAS_BUILD_PLATFORM = 'ios';

const appConfigPath = require.resolve('../app.config.js');
delete require.cache[appConfigPath];
const resolvedExpo = require(appConfigPath).expo;

assert(resolvedExpo.version === packageJson.version, 'app and package versions do not match.');
assert(packageLock.version === packageJson.version, 'package-lock.json version does not match.');
assert(
  packageLock.packages?.['']?.version === packageJson.version,
  'package-lock.json root package version does not match.',
);
assert(
  resolvedExpo.ios?.bundleIdentifier === EXPECTED_BUNDLE_ID,
  `iOS bundle identifier must be ${EXPECTED_BUNDLE_ID}.`,
);

const extra = resolvedExpo.extra ?? {};
const resolvedMappings = {
  analyticsEnv: 'ANALYTICS_ENV',
  posthogProjectToken: 'POSTHOG_PROJECT_TOKEN',
  posthogHost: 'POSTHOG_HOST',
  supabaseUrl: 'EXPO_PUBLIC_SUPABASE_URL',
  supabasePublishableKey: 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  revenueCatIosApiKey: 'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  appsFlyerDevKey: 'EXPO_PUBLIC_APPSFLYER_DEV_KEY',
  appsFlyerAppId: 'EXPO_PUBLIC_APPSFLYER_APP_ID',
};

for (const [extraName, envName] of Object.entries(resolvedMappings)) {
  assert(
    extra[extraName] === profileEnv[envName],
    `resolved expo.extra.${extraName} does not match build.production.env.${envName}.`,
  );
}

console.log(
  `Validated Azora ${resolvedExpo.version} (${EXPECTED_BUNDLE_ID}) with the segregated production environment.`,
);

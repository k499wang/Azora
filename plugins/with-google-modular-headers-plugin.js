const { createRunOncePlugin, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = 'with-google-modular-headers-plugin';
const PLUGIN_VERSION = '1.0.0';

const POD_LINES = [
  '  # AppCheckCore is a Swift pod pulled in by Google Sign-In dependencies. These',
  '  # Objective-C dependencies need module maps when CocoaPods integrates them as',
  '  # static libraries.',
  "  pod 'GoogleUtilities', :modular_headers => true",
  "  pod 'RecaptchaInterop', :modular_headers => true",
].join('\n');

function addGoogleModularHeaders(podfile) {
  if (
    podfile.includes("pod 'GoogleUtilities', :modular_headers => true") &&
    podfile.includes("pod 'RecaptchaInterop', :modular_headers => true")
  ) {
    return podfile;
  }

  const anchor = '  use_expo_modules!\n';
  if (!podfile.includes(anchor)) {
    throw new Error(`${PLUGIN_NAME}: could not find use_expo_modules! in ios/Podfile`);
  }

  return podfile.replace(anchor, `${anchor}${POD_LINES}\n\n`);
}

function withGoogleModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      const podfile = fs.readFileSync(podfilePath, 'utf8');
      fs.writeFileSync(podfilePath, addGoogleModularHeaders(podfile));
      return config;
    },
  ]);
}

module.exports = createRunOncePlugin(
  withGoogleModularHeaders,
  PLUGIN_NAME,
  PLUGIN_VERSION,
);

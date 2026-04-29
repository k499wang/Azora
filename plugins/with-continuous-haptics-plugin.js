const fs = require('fs');
const path = require('path');
const { createRunOncePlugin, withXcodeProject } = require('@expo/config-plugins');
const { addBuildSourceFileToGroup } = require('@expo/config-plugins/build/ios/utils/Xcodeproj');

const PLUGIN_NAME = 'with-continuous-haptics-plugin';
const NATIVE_IOS_DIR = path.join('native', 'ios');
const SOURCE_FILES = ['ContinuousHaptics.swift', 'ContinuousHaptics.m'];

function withContinuousHaptics(config) {
  return withXcodeProject(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosRoot = config.modRequest.platformProjectRoot;

    for (const file of SOURCE_FILES) {
      const src = path.join(projectRoot, NATIVE_IOS_DIR, file);
      const dst = path.join(iosRoot, file);

      if (!fs.existsSync(src)) {
        throw new Error(`${PLUGIN_NAME}: missing source file ${src}`);
      }

      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);

      if (!config.modResults.hasFile(file)) {
        config.modResults = addBuildSourceFileToGroup({
          filepath: file,
          groupName: '',
          project: config.modResults,
        });
      }
    }

    return config;
  });
}

module.exports = createRunOncePlugin(withContinuousHaptics, PLUGIN_NAME, '1.0.0');

const fs = require('fs');
const path = require('path');
const { createRunOncePlugin, withXcodeProject } = require('@expo/config-plugins');
const { addBuildSourceFileToGroup } = require('@expo/config-plugins/build/ios/utils/Xcodeproj');

const PLUGIN_NAME = 'with-completion-audio-plugin';
const SOURCE_FILES = ['CompletionAudio.swift', 'CompletionAudio.m'];

function withCompletionAudio(config) {
  return withXcodeProject(config, (config) => {
    for (const file of SOURCE_FILES) {
      const source = path.join(config.modRequest.projectRoot, 'native', 'ios', file);
      const destination = path.join(config.modRequest.platformProjectRoot, file);
      if (!fs.existsSync(source)) {
        throw new Error(`${PLUGIN_NAME}: missing source file ${source}`);
      }
      fs.copyFileSync(source, destination);
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

module.exports = createRunOncePlugin(withCompletionAudio, PLUGIN_NAME, '1.0.0');

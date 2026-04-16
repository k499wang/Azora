const fs = require('fs');
const path = require('path');
const { createRunOncePlugin, withXcodeProject } = require('@expo/config-plugins');
const { addBuildSourceFileToGroup } = require('@expo/config-plugins/build/ios/utils/Xcodeproj');

const PLUGIN_NAME = 'with-heart-rate-plugin';
const SOURCE_FILES = ['HeartRatePlugin.swift', 'HeartRatePlugin.m'];

function copySourceFile(projectRoot, iosRoot, fileName) {
  const sourcePath = path.join(projectRoot, 'native', 'ios', fileName);
  const destinationPath = path.join(iosRoot, fileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`${PLUGIN_NAME}: missing source file ${sourcePath}`);
  }

  fs.copyFileSync(sourcePath, destinationPath);
}

function addSourceFile(project, fileName) {
  if (project.hasFile(fileName)) {
    return project;
  }

  return addBuildSourceFileToGroup({
    filepath: fileName,
    groupName: '',
    project,
  });
}

function withHeartRatePlugin(config) {
  return withXcodeProject(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosRoot = config.modRequest.platformProjectRoot;

    for (const fileName of SOURCE_FILES) {
      copySourceFile(projectRoot, iosRoot, fileName);
      config.modResults = addSourceFile(config.modResults, fileName);
    }

    return config;
  });
}

module.exports = createRunOncePlugin(withHeartRatePlugin, PLUGIN_NAME, '1.0.0');

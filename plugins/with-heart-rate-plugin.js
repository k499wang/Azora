const fs = require('fs');
const path = require('path');
const { createRunOncePlugin, withXcodeProject } = require('@expo/config-plugins');
const { addBuildSourceFileToGroup } = require('@expo/config-plugins/build/ios/utils/Xcodeproj');

const PLUGIN_NAME = 'with-heart-rate-plugin';
const NATIVE_IOS_DIR = path.join('native', 'ios');
const SWIFT_SOURCE_FILES = ['HeartRatePlugin.swift', 'HeartRatePlugin.m'];
const OBJC_SOURCE_FILES = ['HeartRatePlugin.mm'];
const SOURCE_EXTENSIONS = new Set(['.c', '.cc', '.cpp', '.m', '.mm', '.swift']);

function assertDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath) || !fs.statSync(directoryPath).isDirectory()) {
    throw new Error(`${PLUGIN_NAME}: missing native iOS directory ${directoryPath}`);
  }
}

function listFilesRecursively(directoryPath, relativeTo = directoryPath) {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(entryPath, relativeTo));
      continue;
    }

    if (entry.isFile()) {
      files.push(path.relative(relativeTo, entryPath));
    }
  }

  return files;
}

function copyFile(projectRoot, iosRoot, relativeFilePath) {
  const sourcePath = path.join(projectRoot, NATIVE_IOS_DIR, relativeFilePath);
  const destinationPath = path.join(iosRoot, relativeFilePath);

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}

function nativeFileExists(projectRoot, relativeFilePath) {
  return fs.existsSync(path.join(projectRoot, NATIVE_IOS_DIR, relativeFilePath));
}

function resolveCompiledSourceFiles(projectRoot) {
  const hasSwiftImplementation = SWIFT_SOURCE_FILES.every((fileName) =>
    nativeFileExists(projectRoot, fileName)
  );

  if (hasSwiftImplementation) {
    return SWIFT_SOURCE_FILES;
  }

  return OBJC_SOURCE_FILES.filter((fileName) => nativeFileExists(projectRoot, fileName));
}

function addFileToProject(project, relativeFilePath) {
  if (project.hasFile(relativeFilePath)) {
    return project;
  }

  return addBuildSourceFileToGroup({
    filepath: relativeFilePath,
    groupName: '',
    project,
  });
}

function shouldAddToProject(relativeFilePath, compiledSourceFiles) {
  const extension = path.extname(relativeFilePath);

  return SOURCE_EXTENSIONS.has(extension) && compiledSourceFiles.includes(relativeFilePath);
}

function withHeartRatePlugin(config) {
  return withXcodeProject(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosRoot = config.modRequest.platformProjectRoot;
    const nativeIosRoot = path.join(projectRoot, NATIVE_IOS_DIR);

    assertDirectoryExists(nativeIosRoot);

    const nativeFiles = listFilesRecursively(nativeIosRoot);
    const compiledSourceFiles = resolveCompiledSourceFiles(projectRoot);

    if (compiledSourceFiles.length === 0) {
      throw new Error(`${PLUGIN_NAME}: no compilable heart rate plugin source files found in ${nativeIosRoot}`);
    }

    for (const relativeFilePath of nativeFiles) {
      copyFile(projectRoot, iosRoot, relativeFilePath);

      if (shouldAddToProject(relativeFilePath, compiledSourceFiles)) {
        config.modResults = addFileToProject(config.modResults, relativeFilePath);
      }
    }

    return config;
  });
}

module.exports = createRunOncePlugin(withHeartRatePlugin, PLUGIN_NAME, '1.0.0');

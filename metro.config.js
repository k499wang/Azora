const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);
const artifactsPath = path.join(__dirname, 'artifacts').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...resolver,
  // Backend deployment code and credentials must never enter the mobile bundle.
  blockList: [
    ...(Array.isArray(resolver.blockList) ? resolver.blockList : resolver.blockList ? [resolver.blockList] : []),
    new RegExp(`^${artifactsPath}[\\\\/]`),
  ],
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = config;

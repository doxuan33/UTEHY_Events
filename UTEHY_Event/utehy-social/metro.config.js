'use strict';

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = path.resolve(__dirname);
const config = getDefaultConfig(projectRoot);

try {
  const { withNativeWind } = require('nativewind/metro');
  module.exports = withNativeWind(config, { input: './global.css' });
} catch {
  module.exports = config;
}
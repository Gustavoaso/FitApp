const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalGetPolyfills = config.serializer.getPolyfills;
config.serializer.getPolyfills = (ctx) => [
  path.resolve(__dirname, 'polyfills.js'),
  ...(originalGetPolyfills ? originalGetPolyfills(ctx) : []),
];

module.exports = config;

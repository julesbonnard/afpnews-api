const path = require('path');
const nodeExternals = require('webpack-node-externals');
const commonConfig = require('./common');

module.exports = {
  target: 'node',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'afpnews-api.node.js',
    library: 'AfpNews',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  externals: [nodeExternals()],
  ...commonConfig
};

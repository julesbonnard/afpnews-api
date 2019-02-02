const path = require('path');
const commonConfig = require('./common');

module.exports = {
  target: 'web',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'afpnews-api.js',
    library: 'AfpNews',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  ...commonConfig
};

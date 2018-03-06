var path = require('path');
var nodeExternals = require('webpack-node-externals');

var moduleConfig = {
  rules: [
    {
      enforce: 'pre',
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'eslint-loader'
      }
    },
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader'
      }
    }
  ]
};

var nodeConfig = {
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'AfpNews.node.js',
    library: 'AfpNews',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  externals: [nodeExternals()],
  module: moduleConfig
};

var webConfig = {
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'AfpNews.js',
    library: 'AfpNews',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  module: moduleConfig
};

module.exports = [nodeConfig, webConfig];

var path = require('path');

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
}

var serverConfig = {
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'afpnews.js',
    library: 'afpnews',
    libraryTarget: 'umd'
  },
  module: moduleConfig
};

var clientConfig = {
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'afpnews.browser.js',
    library: 'afpnews',
    libraryTarget: 'umd'
  },
  module: moduleConfig
};

module.exports = [ serverConfig, clientConfig ];

const path = require('path');
const DeclarationBundlerPlugin = require('declaration-bundler-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, '../src/index.ts'),
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devtool: 'source-map',
  module: {
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
        enforce: 'pre',
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'tslint-loader'
        }
      },
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    new DeclarationBundlerPlugin({
        moduleName: 'afpnews-api',
        out: 'afpnews-api.d.ts'
    })
  ]
};

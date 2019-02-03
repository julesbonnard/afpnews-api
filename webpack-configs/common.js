const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, '../dist/esm/index.js'),
  resolve: {
    extensions: ['.js']
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};

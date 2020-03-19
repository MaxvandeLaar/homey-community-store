const nodeExternals = require('webpack-node-externals');


module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: [
    './src/index.ts',
    './src/util/download.ts',
    './src/util/login.ts',
    'src/util/app.ts'
  ],
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],

  },
  externals: {
    homey: 'homey',
    'homey-lib': 'homey-lib'
  }
};

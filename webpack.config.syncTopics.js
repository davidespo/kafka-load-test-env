const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  target: 'node',
  entry: './src/syncTopics.js',
  mode: 'production',
  output: {
    filename: 'syncTopics.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [new Dotenv()],
  resolve: {
    fallback: {
      fs: false,
    },
  },
};

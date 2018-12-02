module.exports = {
  node: {
    fs: 'empty'
  },
  output: {
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader'
      },
    ],
  },
};
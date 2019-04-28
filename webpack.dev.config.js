const webpack = require('webpack')
const merge = require('webpack-merge')
const webpackBaseConfig = require('./config/webpack.base.config')
const paths = require('./config/localpath')
const path = require('path')

module.exports = merge(webpackBaseConfig, {
  mode: 'development',
  devtool: 'cheap-eval-source-map',
  entry: [
    path.join(process.cwd(), './src/js/index.js'),
    'webpack-hot-middleware/client?path=/__webpack_hmr&reload=true',
  ],
  output: {
    path: paths.output,
    filename: 'static/js/[name].js',
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ],
})
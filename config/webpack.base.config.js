const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const paths = require('./localpath')

module.exports = {
  context: paths.context,
  module: {
    rules: [{
        test: /\.(js|jsx|mjs)$/,
        include: paths.context,
        loader: 'babel-loader?cacheDirectory',
        options: {
          compact: true,
        },
      }, {
        test: /\.(scss|sass)$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      }, {
        test   : /\.woff|\.woff2|\.svg|.eot|\.ttf/,
        loader : 'url-loader?prefix=font/&limit=10000'
      }, {
        test: /\.(jpe?g|png|gif|svg)$/i, 
        loader: "file-loader?name=images/[name].[ext]"
      }
    ],
  },
  plugins: [
    new CleanWebpackPlugin([paths.output])
  ],
  resolve: {
    enforceExtension: false,
    extensions: ['.js'],
    alias: {
      '@': path.join(process.cwd(), './src')
    }
  }
}
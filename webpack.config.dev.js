const webpack = require('webpack')
const merge = require('webpack-merge')
const webpackBaseConfig = require('./webpack.config.base')
const paths = require('./config/localpath')
const path = require('path')
const entries = [
  'about',
  'classic',
  'classicmodify',
  'classics',
  'diary',
  'mind',
  'section',
  'sectioneditor',
  'signup',
  'login'
]

let entry = {}
entries.forEach(item => {
  entry[item] = [
    'webpack-hot-middleware/client?path=http://localhost:8080/__webpack_hmr&reload=true', 
    path.join(process.cwd(), `./src/js/${item}.js`)
  ]
})

module.exports = merge(webpackBaseConfig, {
  mode: 'development',
  devtool: 'cheap-eval-source-map',
  entry,
  output: {
    path: paths.output,
    filename: 'static/js/[name].js',
    publicPath: '/',
  },
  module: {
    rules: [{
        test: /\.js$/,
        include: paths.context,
        loader: 'babel-loader?cacheDirectory',
        options: {
          compact: true,
        },
      }, {
        //解析.scss文件
        test: /\.(sa|sc|c)ss$/,
        use: [
           'style-loader',
           'css-loader',
           'postcss-loader',
           'sass-loader'
        ]
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
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ],
})
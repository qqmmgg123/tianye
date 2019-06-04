var path = require('path')
var webpack = require('webpack')
const ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")

module.exports = {
  mode: 'production',
  bail: true,
  profile: false,
  devtool: 'source-map',
  entry: {
    index: './src/index/main.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]/bundle.js'
  },
  optimization: {
    minimizer: [
      // js mini
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: false, // set to true if you want JS source maps
        uglifyOptions: {
          warnings: false,
          parse: {},
          compress: {},
          mangle: true, // Note `mangle.properties` is `false` by default.
          output: null,
          toplevel: false,
          nameCache: null,
          ie8: false,
          keep_fnames: false,
        },
      }),
      // css mini
      //new OptimizeCSSPlugin({})
    ]
  },
  plugins: [
    new ExtractTextPlugin('[name]/styles.css'),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index/index.html',
      template: './src/index/index.html'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ],
  module: {
    rules: [
      { 
        test: /\.js$/, 
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.sass$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          //resolve-url-loader may be chained before sass-loader if necessary
          use: ['css-loader', 'postcss-loader', 'sass-loader']
        })
      }, {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({ 
          fallback: 'style-loader', 
          use: ['css-loader', 'postcss-loader']
        })
      }, {
        test   : /\.woff|\.woff2|\.svg|.eot|\.ttf/,
        loader : 'url-loader?prefix=font/&limit=10000'
      }, {
        test: /\.(jpe?g|png|gif|svg)$/i, 
        loader: "file-loader?name=images/[name].[ext]"
      }
    ]
  },
  resolve: {
    enforceExtension: false,
    extensions: ['.js'],
    alias: {
      '@': path.join(process.cwd(), './src')
    }
  },
}
const path = require('path')
, webpack = require('webpack')
, UglifyJsPlugin = require('uglifyjs-webpack-plugin')
, MiniCssExtractPlugin = require('mini-css-extract-plugin')
, OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
, merge = require('webpack-merge')
, webpackBaseConfig = require('./webpack.config.base')
, paths = require('./config/localpath')
, entries = [
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
  entry[item] = path.join(process.cwd(), `./src/js/${item}.js`)
})

module.exports = merge(webpackBaseConfig, {
  mode: 'production',
  bail: true,
  profile: false,
  devtool: 'source-map',
  entry,
  output: {
    path: paths.output,
    filename: 'js/[name].js',
  },
  optimization: {
    minimize: true,
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
    new MiniCssExtractPlugin({
      filename: 'css/[name].css', //类似出口文件
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/g,       //一个正则表达式，指示应优化/最小化的资产的名称。提供的正则表达式针对配置中ExtractTextPlugin实例导出的文件的文件名运行，而不是源CSS文件的文件名。默认为/\.css$/g
      cssProcessor: require('cssnano'), //用于优化\最小化CSS的CSS处理器，默认为cssnano
      cssProcessorOptions: { 
        safe: true, 
        parser: require('postcss-safe-parser'),
        discardComments: { removeAll: true } 
      }, //传递给cssProcessor的选项，默认为{}
      canPrint: true //一个布尔值，指示插件是否可以将消息打印到控制台，默认为true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        //打包公共模块
        /* commons: {
          chunks: 'initial', //initial表示提取入口文件的公共部分
          minChunks: 2, //表示提取公共部分最少的文件数
          test: new RegExp(`\/${agent}\/common`),
          minSize: 0, //表示提取公共部分最小的大小
          name: 'global' //提取出来的文件命名
        } */
        'global': {
          test: /global/, // 直接使用 test 来做路径匹配
          chunks: 'initial',
          name: 'global',
          enforce: true,
        }
      }
    }
  },
  module: {
    rules: [
      { 
        test: /\.js$/, 
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }, {
        //解析.scss文件
         test: /\.(sa|sc|c)ss$/,
         use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader'
         ]
      }, {
        test   : /\.woff|\.woff2|\.svg|.eot|\.ttf/,
        loader : 'url-loader?prefix=font/&limit=10000'
      }, {
        test: /\.(jpe?g|png|gif|svg)$/i, 
        loader: 'file-loader?name=images/[name].[ext]'
      }
    ]
  },
})

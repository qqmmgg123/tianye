const CleanWebpackPlugin = require('clean-webpack-plugin')
const path = require('path')
const paths = require('./config/localpath')

module.exports = {
  context: paths.context,
  plugins: [
    new CleanWebpackPlugin([paths.output])
  ],
  resolve: {
    enforceExtension: false,
    extensions: ['.js'],
    // 针对 Npm 中的第三方模块优先采用 jsnext:main 中指向的 ES6 模块化语法的文件
    mainFields: ['jsnext:main', 'browser', 'main'],
    alias: {
      '@': path.join(process.cwd(), './src'),
      'ejs': path.join(process.cwd(), './src/js/lib/ejs.js')
    }
  }
}
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('cssnano')({
      preset: 'default',
    }),
    //require('postcss-pxtorem')({
      //rootValue: 100
    //})
  ]
}

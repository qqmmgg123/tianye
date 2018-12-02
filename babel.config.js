module.exports = api => {
  api.cache(false)
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          'useBuiltIns': 'entry'
        }
      ]
    ],
    plugins: ["transform-html-import-require-to-string"]
  }
}
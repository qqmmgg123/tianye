module.exports = api => {
  api.cache(false)
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          'useBuiltIns': 'usage',
          'corejs': 2,
          'modules': false
        }
      ]
    ],
    plugins: ["transform-html-import-require-to-string"]
  }
}
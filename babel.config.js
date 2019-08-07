module.exports = api => {
  api.cache(false)
  return {
    presets: [
      [
        '@babel/preset-env',
        {
          'useBuiltIns': 'entry',
          'corejs': 2
        }
      ]
    ],
    plugins: ["transform-html-import-require-to-string"]
  }
}
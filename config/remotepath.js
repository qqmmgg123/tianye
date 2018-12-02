const staticDir = '/static/'
const exts = [ 'css', 'js' ]

let paths = {}
for (let ext of exts) {
  paths[ext] = `${staticDir}${ext}/`
}

module.exports = {
  staticDir: Object.assign({ root: staticDir }, paths)
}
'use strict'

const path = require('path')
const { staticDir } = require('./config/remotepath')
const cssExt = 'css'
const jsExt = 'js'

module.exports = function(ctx, next) {
  if (ctx.fullRender) return next()
  ctx.response.fullRender = ctx.fullRender = function(relPath, locals = {}) {
    let tempRoot = path.join(__dirname, 'views/')
    let data = Object.assign(locals, ctx.state || {})
    let clientData = encodeURIComponent(JSON.stringify(data))
    let serverData = Object.assign(data, { 
      pageStyleFile: `${staticDir[cssExt]}${relPath}.${cssExt}`,
      pageScriptFile: `${staticDir[jsExt]}${relPath}.${jsExt}`,
      tempRoot,
      particles: `${relPath}.html`,
      globalData: clientData
    })
    if (!ctx.isXhr) {
      return ctx.render('layouts/layout', serverData)
    } else {
      ctx.body = clientData
    }
  }
  return next()
}

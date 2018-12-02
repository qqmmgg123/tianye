const constant = require('./settings/const')

module.exports = (ctx, next) => {
  if (ctx.isAuthenticated()) {
    return next()
  } else {
    let { method } = ctx.request
    ctx.status = 401
    if (!ctx.state.isXhr) {
      ctx.redirect('/login')
    } else {
      ctx.body = {
        success: false,
        code: 1002,
        message: constant.AUTHENTICATION_FAILURE_ERR
      }
    }
  }
}

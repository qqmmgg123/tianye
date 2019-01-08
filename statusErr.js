module.exports = async (ctx, next) => {
  try {
    await next();
    if (ctx.status === 404) {
      ctx.throw(404);
    }
  } catch (err) {
    if (err.name === 'ValidationError') {
      if (!ctx.state.isXhr) {
        ctx.session.info = err.message.split(':')[2]
        ctx.redirect(ctx.session.currentFormUrl || '/')
      } else {
        ctx.body = {
          success: false,
          info: err.message.split(':')[2]
        }
      }
    } else {
      console.error(err.message)
      const status = err.status || 500;
      ctx.status = status;
      if (!ctx.state.isXhr) {
        if (status === 404) {
          ctx.body = '<h1>404!</h1>'
        } else if (status === 500) {
          ctx.body = '<h1>500!</h1>'
        }
      } else {
        ctx.body = {
          success: false,
          code: 1001,
          message: err.message
        }
      }
    }
  }
}

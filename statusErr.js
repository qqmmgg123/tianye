module.exports = async (ctx, next) => {
  try {
    await next();
    if (ctx.status === 404) {
      ctx.throw(404);
    }
  } catch (err) {
    console.log(err)
    if (err.name === 'ValidationError') {
      ctx.session.info = err.message.split(':')[2]
      ctx.redirect(ctx.session.currentFormUrl || '/')
    } else {
      const status = err.status || 500;
      ctx.status = status;
      if (status === 404) {
        ctx.body = '<h1>404!</h1>'
      } else if (status === 500) {
        ctx.body = '<h1>500!</h1>'
      }
    }
  }
}
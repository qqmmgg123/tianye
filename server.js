const Koa = require('koa')
const Router = require('koa-router')
const views = require('koa-views')
const constant = require('./settings/const')
// const webpack = require('webpack')
// const { koaDevMiddleware, koaHotMiddleware } = require('./hmr')
// const webpackDevConfig = require('./webpack.dev.config')
const statusErr = require('./statusErr')
const pageAuth = require('./pageAuth')
const mongoose = require('mongoose')
const User = require('./models/user')
const Trouble = require('./models/trouble')
const OwnerTrouble = require('./models/owner_trouble')
const Comfort = require('./models/comfort')
const Comment = require('./models/comment')
const Reply = require('./models/reply')
const session = require('koa-session')
const utils = require('./utils')
const crypto = require('crypto')
// const fs = require('fs')

const app = new Koa()
const router = new Router()

const port = process.env.PORT || 3000
// const webpackCompiler = webpack(webpackDevConfig)

/* app.use(koaDevMiddleware(webpackCompiler, {
  noInfo: true,
}))
app.use(koaHotMiddleware(webpackCompiler, {
  path: '/__webpack_hmr',
  heartbeat: 10 * 1000,
})) */

//连接mongodb 数据库 ，地址为mongodb的地址以及集合名称。
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true)
mongoose.connect('mongodb://localhost/tianye', { useNewUrlParser: true })

// trust proxy
app.proxy = true

// 页面模版
app.use(views(__dirname + '/views', {
  map: {
    html: 'underscore'
  }
}))

// session
app.keys = ['your-session-secret'];

const CONFIG = {
  key: 'koa:sess', /** (string) cookie key (default is koa:sess) */
  /** (number || 'session') maxAge in ms (default is 1 days) */
  /** 'session' will result in a cookie that expires when session/browser is closed */
  /** Warning: If a session cookie is stolen, this cookie will never expire */
  maxAge: 86400000,
  autoCommit: true, /** (boolean) automatically commit headers (default true) */
  overwrite: true, /** (boolean) can overwrite or not (default true) */
  httpOnly: true, /** (boolean) httpOnly or not (default true) */
  signed: true, /** (boolean) signed or not (default true) */
  rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
  renew: false, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
}

app.use(session(CONFIG, app))

// body parser
const bodyParser = require('koa-bodyparser')
app.use(bodyParser())

// 保存全局模版数据
app.use((ctx, next) => {
  let user = ctx.cookies.request.user
  ctx.state = {}
  ctx.state.user = user || null
  return next()
})

// 日志输出
/* const morgan = require('koa-morgan')
const accessLogStream = fs.createWriteStream(__dirname + '/access.log', { 
  flags: 'a'
})
app.use(morgan('combined', {
  stream: accessLogStream,
})) */

// authentication
require('./auth')
const passport = require('koa-passport')
app.use(passport.initialize())
app.use(passport.session())

/*app.on("error",(err,ctx)=>{//捕获异常记录错误日志
  console.log(new Date(),":",err);
})*/

// 写入需要验证用户
router.use([
  '/mine',
  '/trouble', 
  '/:id/comfort', 
  '/:id/comment', 
  '/:type/:id/reply',
], pageAuth)

// 错误处理
router.all('*', statusErr)

// 首页
router.get('/', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  let info = ctx.session.info
  let troubles = await Trouble.find({}).sort({ create_date: -1 })
  await ctx.render('index', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    troubleHolder: constant.TROUBLE_HOLDER,
    troubles,
    info
  })

  ctx.session.info = null
})

// 登录页
router.get('/login', async (ctx) => {
  ctx.session.currentFormUrl = '/login'
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_SIGNIN_PAGE
    ].join('——')
  })

  const info = ctx.session.info
  await ctx.render('login', {
    slogan: constant.APP_SLOGAN,
    usernameHolder: constant.USERNAME_HOLDER,
    passwordHolder: constant.PASSWORD_HOLDER,
    info
  })

  ctx.session.info = null
})

// 登录
router.post('/login', (ctx) => {
  return passport.authenticate('local', (err, user, info, status) => {
    if (err) {
      ctx.session.info = err.message
      ctx.redirect('/login')
    } else {
      if (!user) {
        ctx.session.info = constant.USER_NOT_EXISTS
        ctx.redirect('/login')
      } else {
        ctx.login(user, (err) => {
          if (err) {
            ctx.session.info = err.message
            ctx.redirect('/login')
          } else {
            const { currentUrl } = ctx.session
            if (currentUrl) {
              ctx.redirect(currentUrl)
              ctx.session.currentUrl = null
            } else {
              ctx.redirect('/')
            }
          }
        })
      }
    }
  })(ctx)
})

router.get('/logout', function(ctx) {
  ctx.logout()
  ctx.redirect('/')
})

// qq auth
router.get('/auth/qq',
  passport.authenticate('qq'),
)

router.get('/auth/qq/callback', 
  passport.authenticate('qq', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
)

// google auth
router.get('/auth/google',
  passport.authenticate('google')
)

router.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
)

// 注册页
router.get('/signup', async (ctx) => {
  ctx.session.currentFormUrl = '/signup'
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_SIGNIN_PAGE
    ].join('——')
  })

  await ctx.render('signup', {
    slogan: constant.APP_SLOGAN,
    usernameHolder: constant.USERNAME_HOLDER,
    passwordHolder: constant.PASSWORD_HOLDER,
    info: ctx.session.info
  })

  ctx.session.info = null
})

// 注册
router.post('/signup', async (ctx, next) => {
  const { username = '', password = '' } =  ctx.request.body

  let user = await User.findOne({ username })

  if (user) {
    ctx.session.info = constant.USER_EXISTS
    ctx.redirect('/signup')
  } else {
    let buf = await crypto.randomBytes(32)
    let salt = buf.toString('hex')
    let hash = await utils.pbkdf2(password, salt)
    user = new User({
      username : username.trim(),
    })
    user.set('hash', new Buffer(hash, 'binary').toString('hex'));
    user.set('salt', salt);
    user.isAuthenticated = false
    await user.save()
    return passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login'
    })(ctx)
  }
})

// 记录当前页面url状态
router.use([
  '/:id/comforts', 
  '/:id/comments', 
  '/:type/:id/replys',
], (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  return next()
})

// 我的
router.get('/mine', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_MINE_PAGE
    ].join('——')
  })

  let info = ctx.session.info
  let relations = await OwnerTrouble.find({ 
    owner_id: ctx.state.user.id
  }).populate('trouble_id')
    .sort({ owned_date: -1 })
  
  await ctx.render('mine', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    noDataTips: constant.NO_MINE_TROUBLE,
    relations,
    info
  })

  ctx.session.info = null
})

// 鸡汤页
router.get('/:id/comforts', async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_COMFORT_PAGE
    ].join('——')
  })

  let info = ctx.session.info
  let trouble = await Trouble.findById(ctx.params.id)
  if (trouble) {
    let comforts = await Comfort.find({ trouble_id: ctx.params.id }).sort({ create_date: -1 })
    await ctx.render('comfort', {
      appName: constant.APP_NAME,
      slogan: constant.APP_SLOGAN,
      trouble,
      comfortHolder: constant.COMFORT_HOLDER,
      comforts,
      info
    })
  } else {
    next()
  }

  ctx.session.info = null
})

// 评论页
router.get('/:id/comments', async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_COMMENT_PAGE
    ].join('——')
  })

  let info = ctx.session.info
  let comfort = await Comfort.findById(ctx.params.id)
  if (comfort) {
    let comments = await Comment.find({ comfort_id: ctx.params.id }).sort({ create_date: -1 })
    await ctx.render('comment', {
      appName: constant.APP_NAME,
      slogan: constant.APP_SLOGAN,
      comfort,
      commentHolder: constant.COMMENT_HOLDER,
      comments,
      info
    })
  } else {
    next()
  }

  ctx.session.info = null
})

// 回复页
router.get('/:type/:id/replys', async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_REPLY_PAGE
    ].join('——')
  })

  let info = ctx.session.info
  let replyTo = null
  let { type, id } = ctx.params
  switch (ctx.params.type) {
    case 'comment':
      replyTo = await Comment.findById(id)
      break
    case 'reply':
      replyTo = await Reply.findById(id)
      break
  }
  if (replyTo) {
    let replys = await Reply.find({ 
      reply_id: id, 
      reply_type: type
    }).sort({ create_date: -1 })
    await ctx.render('reply', {
      appName: constant.APP_NAME,
      slogan: constant.APP_SLOGAN,
      replyType: type,
      replyTo,
      replyHolder: constant.REPLY_HOLDER,
      replys,
      info
    })
  } else {
    next()
  }

  ctx.session.info = null
})

// 添加烦恼
router.post('/trouble', async (ctx) => {
  const content = (ctx.request.body.content || '').trim()
  if (content) {
    let trouble = new Trouble({ 
      content,
      created_id: ctx.state.user.id
    })
    await trouble.save()
    let ownerTrouble = new OwnerTrouble({ 
      owner_id: ctx.state.user.id,
      trouble_id: trouble.id
    })
    await ownerTrouble.save()
  } else {
    ctx.session.info = constant.NO_TROUBLE_CONTENT
  }
  ctx.redirect('/')
  ctx.status = 302
})

// 给点鸡汤
router.post('/:id/comfort', async (ctx, next) => {
  const content = (ctx.request.body.content || '').trim()
  if (content) {
    let comfort = new Comfort({ 
      content, 
      trouble_id: ctx.params.id,
      created_id: ctx.state.user.id
    })
    await comfort.save()
  } else {
    ctx.session.info = constant.NO_TROUBLE_CONTENT
  }
  ctx.redirect(`/${ctx.params.id}/comforts`)
  ctx.status = 302
})

// 说说看法
router.post('/:id/comment', async (ctx, next) => {
  const content = (ctx.request.body.content || '').trim()
  if (content) {
    let comment = new Comment({ 
      content, 
      comfort_id: ctx.params.id,
      created_id: ctx.state.user.id
    })
    await comment.save()
  } else {
    ctx.session.info = constant.NO_TROUBLE_CONTENT
  }
  ctx.redirect(`/${ctx.params.id}/comments`)
  ctx.status = 302
})

// 回复
router.post('/:type/:id/reply', async (ctx, next) => {
  const content = (ctx.request.body.content || '').trim()
  let { type, id } = ctx.params
  if (content) {
    let reply = new Reply({ 
      content, 
      reply_id: id,
      reply_type: type,
      created_id: ctx.state.user.id
    })
    await reply.save()
  } else {
    ctx.session.info = constant.NO_TROUBLE_CONTENT
  }
  ctx.redirect(`/${type}/${id}/replys`)
  ctx.status = 302
})

app
  .use(router.routes())
  .use(router.allowedMethods())


app.listen(port, () => {
  console.log(`Tianye app starting at port ${port}`)
})

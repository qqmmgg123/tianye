require('dotenv').config()

const Koa = require('koa')
const Router = require('koa-router')
const views = require('koa-views')
const serve = require('koa-static')
const mount = require('koa-mount')
const json = require('koa-json')
const constant = require('./settings/const')
const statusErr = require('./statusErr')
const pageAuth = require('./pageAuth')
const fullRenderer = require('./fullRenderer')
const mongoose = require('mongoose')
const User = require('./models/user')
const Verification = require('./models/verification')
const Diary = require('./models/diary')
const Trouble = require('./models/trouble')
const Share = require('./models/share')
const Classic = require('./models/classic')
const Reply = require('./models/reply')
const Thank = require('./models/thank')
const Friend = require('./models/friend')
const session = require('koa-session')
const { filterMsg, pageRange, getDate, pbkdf2 } = require('./utils')
const crypto = require('crypto')
const path = require('path')
const { staticDir } = require('./config/remotepath')
const nodemailer = require("nodemailer")
const smtpTransport = require('nodemailer-smtp-transport')
const wellknown = require("nodemailer-wellknown")
const config = wellknown("QQ")
const phoneToken = require('generate-sms-verification-code')

config.auth = {
  user:'290448666@qqcom',
  pass:'Hakehaha123'
}

// let transporter = nodemailer.createTransport(smtpTransport(config))
//创建一个smtp服务器
const emailOpts = {
  host: 'smtp.126.com',
  secureConnection: true,
  port: 465,
  secure: true,
  auth: {
    user: 'qqmmgg123@126.com',
    pass: 'hakehaha123'
  }
}
// 创建一个SMTP客户端对象
const transporter = nodemailer.createTransport(emailOpts)

const app = new Koa()
const router = new Router()

const port = process.env.PORT || 3000

//连接mongodb 数据库 ，地址为mongodb的地址以及集合名称。
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true)
mongoose.connect('mongodb://localhost/db', { useNewUrlParser: true })

// trust proxy
app.proxy = true
// json字符串处理
app.use(json())

// 静态文件
const staticPath = path.resolve(__dirname, './dist')
app.use(mount(staticDir.root, serve(staticPath)))

// 页面模版
app.use(views(__dirname + '/views', {
  map: {
    html: 'ejs'
  }
}))

app.use(fullRenderer)

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
app.use(bodyParser({
  formLimit: '1mb'
}))

// 保存全局模版数据
app.use((ctx, next) => {
  let user = ctx.cookies.request.user
  let cssExt = 'css'
  ctx.state = {}
  ctx.state.user = user || null
  ctx.state.globalStyleFile = `${staticDir[cssExt]}global.${cssExt}`
  ctx.state.friendName = constant.FRIEND_NAME
  ctx.state.anonymous = constant.ANONYMOUS_NAME
  ctx.state.isXhr = ctx.request.get('X-Requested-With') === 'XMLHttpRequest'
  ctx.state.dateFormat = function (date) {
    return getDate(date)
  } 
  return next()
})

// authentication
require('./auth')
const passport = require('koa-passport')
app.use(passport.initialize())
app.use(passport.session())

// 访问需要验证用户
router.use([
  '/friend',
  '/features/diary',
  '/features/help',
  '/recommend/helps'
], (ctx, next) => {
  let { method } = ctx.request
  if (method === 'GET') {
    return pageAuth(ctx, next)
  } else {
    return next()
  }
})

// 写入需要验证用户
router.use([
  '/diary',
  '/trouble',
  '/share',
  '/classic',
  '/thank/:shareId',
  '/:type/:id/reply',
  '/diary/:id',
  '/trouble/:id',
  '/share/:id',
  '/classic/:id',
  '/reply/:id',
], (ctx, next) => {
  let { method } = ctx.request
  if ([
    'POST', 
    'DELETE', 
    'PUT'
  ].indexOf(method) > -1) {
    return pageAuth(ctx, next)
  } else {
    return next()
  }
})

// 错误处理
router.all('*', statusErr)

// 首页
router.get('/', async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    ctx.redirect('/features/diary')
  } else {
    ctx.redirect('/features/share')
  }
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
  await ctx.fullRender('login', {
    appName: constant.APP_NAME,
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

  await ctx.fullRender('signup', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    usernameHolder: constant.USERNAME_HOLDER,
    passwordHolder: constant.PASSWORD_HOLDER,
    emailHolder: constant.EMAIL_HOLDER,
    username: '',
    password: '',
    email: '',
    code: '',
    info: ctx.session.info
  })

  ctx.session.info = null
})

// 注册
router.post('/signup', async (ctx, next) => {
  let { 
    username = '裘大钢', 
    password = 'qnmdwbd0000',
    email = '', 
    code = ''
  } = ctx.request.body

  username = username.trim()
  email = email.trim()
  code = code.trim()
  console.log(email, code)

  let vcode = await Verification.findOne({ 
    email: email,
    code: code
  }, 'email code').lean()

  console.log(vcode)

  if (!vcode) {
    ctx.body = {
      success: false,
      info: constant.VCODE_ERROR
    }
    return
  }

  let user = await User.findOne({ $or : [
    { username }, { email }
  ]}, 'username email').lean()

  if (user) {
    let errmsg = ''
    if (user.username === username) {
      errmsg = constant.USER_EXISTS
    } else {
      errmsg = constant.EMAIL_EXISTS
    }
    ctx.body = {
      success: false,
      info: errmsg
    }
  } else {
    let buf = await crypto.randomBytes(32)
    let salt = buf.toString('hex')
    let hash = await pbkdf2(password, salt)
    await User.create({
      username : username,
      email: email,
      hash: new Buffer(hash, 'binary').toString('hex'),
      salt: salt
    })
    await Verification.deleteOne({ 
      email: email,
      code: code
    })
    return passport.authenticate('local', (err, user, info, status) => {
      console.log(err)
      if (err) {
        ctx.body = {
          success: false,
          info: err.message
        }
      } else {
        if (!user) {
          ctx.status = 401
          ctx.body = {
            success: false,
            code: 1002,
            message: constant.AUTHENTICATION_FAILURE_ERR
          }
        } else {
          ctx.login(user, (err) => {
            if (err) {
              ctx.body = {
                success: false,
                info: err.message
              }
            } else {
              const { currentUrl } = ctx.session
              if (currentUrl) {
                ctx.session.currentUrl = null
                ctx.body = {
                  success: true,
                  redirectUrl: currentUrl
                }
              } else {
                ctx.body = {
                  success: true,
                  redirectUrl: '/'
                }
              }
            }
          })
        }
      }
    })(ctx)
  }
})

// 给邮箱发送验证码
router.post('/email/vcode',async (ctx)=>{
  let { 
    email = '',
  } = ctx.request.body
  email = email.trim()

  // 验证用户是否已经被注册
  let user = await User.findOne({ email }, 'email').lean()
  if (user) {
    ctx.body = {
      success: false,
      info: constant.EMAIL_EXISTS
    }
    return
  }

  let code = ''
  let verification = await Verification.findOne({ email }, 'code').lean()
  if (verification && verification.code) {
    code = verification.code
  } else {
    // 生成验证码并发送到邮箱
    code = await phoneToken(6, {type: 'string'})
  }

  // 保存匹配验证码记录
  await Verification.updateOne(
    { email },
    { $set: { email, code }},
    { 
      runValidators: true,
      upsert: true, 
      new: true 
    }
  )

  // 发送验证码邮件
  try {
    await transporter.sendMail({
      // 发件人
      from: '<qqmmgg123@126.com>',
      // 主题
      subject: '验证码',//邮箱主题
      // 收件人
      to: email,//前台传过来的邮箱
      // 邮件内容，HTML格式
      text: '用 ' + code + ' 作为你的验证码'
    })
    ctx.body = {
      success: true
    }
  } catch (err) {
    console.log(err)
    ctx.body = {
      success: false,
      info: '发送验证码失败。'
    }
  }
})

// 记录当前页面url状态
router.use([
  '/classic/:id',
], (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  return next()
})

// 知己
router.get('/friend', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  let { user } = ctx.state

  let friends = await Friend.aggregate(
    [
     { '$lookup': {
        'from': Friend.collection.name,
        'let': { 'recipient': '$recipient' },
        'pipeline': [
          { '$match': { 
            'recipient': user._id, 
            "$expr": { "$eq": [ "$requester", "$$recipient" ] }
          }},
        ],
        'as': 'friend'
      }},
      { '$lookup': {
        'from': User.collection.name,
        'localField': 'recipient',
        'foreignField': '_id',
        'as': 'user'
      }},
      { '$match': { 'requester': user._id } },
      { '$project': {
        'status': 1,
        'content': 1,
        'remark': 1,
        'recipient_status': { '$ifNull': [ { "$min": "$friend.status" }, 0 ] },
        'recipient_id': '$user._id',
        'recipient_name': '$user.username',
      }}
    ]
  )

  // 返回并渲染
  await ctx.fullRender('friend', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    friends,
    info
  })

  ctx.session.info = null
})

// 查找用户
router.get('/user/search', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  let username = query.username && query.username.trim() || ''

  // 来源页错误信息
  let info = ctx.session.info

  // 结果总数
  let total = await User.countDocuments({ username })
  let totalPage = Math.ceil(total / limit)

  let { user } = ctx.state

  let users = await User.aggregate(
    [
      { '$lookup': {
        'from': Friend.collection.name,
        'let': { 'user_id': '$_id' },
        'pipeline': [{ 
          '$match': { 
            'recipient': user._id,
            "$expr": { "$eq": [ "$requester", "$$user_id" ] }
          }
        }],
        'as': 'requester'
      }},
      { '$lookup': {
        'from': Friend.collection.name,
        'let': { 'user_id': '$_id' },
        'pipeline': [{ 
          '$match': { 
            'requester': user._id,
            "$expr": { "$eq": [ "$recipient", "$$user_id" ] }
          }
        }],
        'as': 'recipient'
      }},
      { '$match': { username }},
      { '$project': {
        '_id': 1,
        'username': 1,
        'isfriend': {
          '$and': [
            { 
              "$eq": [ { '$min': '$requester.status' }, 3 ]
            }, { 
              "$eq": [ { '$min': '$recipient.status' }, 3 ]
            }]
          }
      }},
      { '$sort': { 'joinedDate': -1 } },
      { '$skip' : skip },
      { "$limit": limit }
    ]
  )

  // 返回并渲染首页
  ctx.body = {
    success: true,
    pageInfo: {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage: page < totalPage ? page + 1 : 0,
    },
    users,
    info
  }

  ctx.session.info = null
})

// 心情杂记
router.get('/features/diary', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 来源页错误信息
  let info = ctx.session.info

  // 烦恼总数
  let total = await Diary.estimatedDocumentCount()
  let totalPage = Math.ceil(total / limit)

  // 查找所有记录
  let diarys = await Diary.find({})
    .sort({ created_date: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('diary', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    diaryHolder: constant.DIARY_HOLDER,
    features: constant.FEATURES,
    noDataTips: constant.NO_DIARYS,
    pageInfo: {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage: page < totalPage ? page + 1 : 0,
    },
    diarys,
    info
  })

  ctx.session.info = null
})

// 排忧解难
router.get('/features/help', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_MINE_PAGE
    ].join('——')
  })
  let { user } = ctx.state

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 我的烦恼总数
  let totalPage = Math.ceil(0 / limit)

  let info = ctx.session.info
  let relations = await Trouble.aggregate(
    [
      { '$lookup': {
        'from': Friend.collection.name,
        'let': { 'creator_id': '$creator_id' },
        'pipeline': [{ 
          '$match': { 
            'recipient': user._id,
            "$expr": { "$eq": [ "$requester", "$$creator_id" ] }
          }
        }],
        'as': 'requester'
      }},
      { '$lookup': {
        'from': Friend.collection.name,
        'let': { 'creator_id': '$creator_id' },
        'pipeline': [{ 
          '$match': { 
            'requester': user._id,
            "$expr": { "$eq": [ "$recipient", "$$creator_id" ] }
          }
        }],
        'as': 'recipient'
      }},
      { '$lookup': {
        'from': User.collection.name,
        'localField': 'creator_id',
        'foreignField': '_id',
        'as': 'user'
      }},
      { '$lookup': {
        'from': Reply.collection.name,
        'let': { 'trouble_id': '$_id' },
        'pipeline': [
          { '$lookup': {
            'from': Friend.collection.name,
            'let': { 'creator_id': '$creator_id' },
            'pipeline': [{ 
              '$match': { 
                'recipient': user._id,
                "$expr": { "$eq": [ "$requester", "$$creator_id" ] }
              }
            }],
            'as': 'requester'
          }},
          { '$lookup': {
            'from': Friend.collection.name,
            'let': { 'creator_id': '$creator_id' },
            'pipeline': [{ 
              '$match': { 
                'requester': user._id,
                "$expr": { "$eq": [ "$recipient", "$$creator_id" ] }
              }
            }],
            'as': 'recipient'
          }},
          { '$lookup': {
            'from': User.collection.name,
            'localField': 'creator_id',
            'foreignField': '_id',
            'as': 'user'
          }},
          { '$lookup': {
            'from': User.collection.name,
            'localField': 'receiver_id',
            'foreignField': '_id',
            'as': 'receiver'
          }},
          { '$lookup': {
            'from': Classic.collection.name,
            'localField': 'ref_id',
            'foreignField': '_id',
            'as': 'classic'
          }},
          { '$match': {  '$expr': {'$and': [{ "$eq": [ "$parent_id", "$$trouble_id" ] }, { '$or': [{ '$and': [{ '$eq': [{ '$min': '$recipient.status' }, 3] }, { '$eq': [{ '$min':'$requester.status' }, 3] }] }, { '$eq': ['$creator_id', user._id ]}]}]}}},
          { '$group': { '_id': '$parent_id', 'data':{ '$push':{ 'rs': '$$ROOT', 'us': '$user', 'rus': '$receiver', 'rec': '$recipient', 'ref': '$classic' } }, 'count': { '$sum': 1 } } },
          { '$unwind': '$data' },
          {
            '$project': {
              '_id': '$data.rs._id',
              'content': "$data.rs.content",
              'reply_type': "$data.rs.reply_type",
              'creator_id': "$data.rs.creator_id",
              'created_date': "$data.rs.created_date",
              'username': '$data.us.username',
              'remark': '$data.rec.remark',
              'receivername': '$data.rus.username',
              'ref_id': '$data.ref._id',
              'ref_title': '$data.ref.title',
              'ref_summary': '$data.ref.summary',
              'count': 1
            }
          },
          { '$sort': { 'created_date': -1 } },
          { "$limit": 5 }
        ],
        'as': 'replies'
      }},
      { '$match': {  "$expr": { '$or': [{ '$and': [{ '$eq': [{ '$min': '$recipient.status' }, 3] }, { '$eq': [{ '$min':'$requester.status' }, 3] }] }, {'$eq': ['$creator_id', user._id]}]}}},
      { '$project': {
        '_id': 1,
        'content': 1,
        'replies': '$replies',
        'creator_id': 1,
        'last_reply_date': 1,
        'created_date': 1,
        'username': '$user.username',
        'remark': '$recipient.remark',
        'reply_count': { '$max': '$replies.count'}
      }},
      { '$sort': { 'last_reply_date': -1, 'created_date': -1 } },
      { '$skip' : skip },
      { "$limit": limit }
    ]
  )
  
  await ctx.fullRender('helps', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    troubleHolder: constant.TROUBLE_HOLDER,
    noDataTips: constant.NO_MINE_TROUBLE,
    features: constant.FEATURES,
    pageInfo: {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage: page < totalPage ? page + 1 : 0,
    },
    relations,
    info
  })

  ctx.session.info = null
})

// 获取具体排忧解难
router.get('/help/:id', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_MINE_PAGE
    ].join('——')
  })
  let { user } = ctx.state

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 我的烦恼总数
  let totalPage = Math.ceil(0 / limit)

  let info = ctx.session.info
  
  let troubleId = mongoose.Types.ObjectId(ctx.params.id)
  let helps = await Trouble.aggregate(
    [
      { '$lookup': {
        'from': User.collection.name,
        'localField': 'creator_id',
        'foreignField': '_id',
        'as': 'user'
      }},
      { '$lookup': {
        'from': Reply.collection.name,
        'let': { 'trouble_id': '$_id' },
        'pipeline': [
          { '$lookup': {
            'from': Friend.collection.name,
            'let': { 'creator_id': '$creator_id' },
            'pipeline': [{ 
              '$match': { 
                'recipient': user._id,
                "$expr": { "$eq": [ "$requester", "$$creator_id" ] }
              }
            }],
            'as': 'requester'
          }},
          { '$lookup': {
            'from': Friend.collection.name,
            'let': { 'creator_id': '$creator_id' },
            'pipeline': [{ 
              '$match': { 
                'requester': user._id,
                "$expr": { "$eq": [ "$recipient", "$$creator_id" ] }
              }
            }],
            'as': 'recipient'
          }},
          { '$lookup': {
            'from': User.collection.name,
            'localField': 'creator_id',
            'foreignField': '_id',
            'as': 'user'
          }},
          { '$lookup': {
            'from': Classic.collection.name,
            'localField': 'ref_id',
            'foreignField': '_id',
            'as': 'classic'
          }},
          { '$match': {  '$expr': {'$and': [{ "$eq": [ "$parent_id", "$$trouble_id" ] }, { '$or': [{ '$and': [{ '$eq': [{ '$min': '$recipient.status' }, 3] }, { '$eq': [{ '$min':'$requester.status' }, 3] }] }, { '$eq': ['$creator_id', user._id ]}]}]}}},
          { '$group': { '_id': '$parent_id', 'data':{ '$push':{ 'rs': '$$ROOT', 'us': '$user', 'rec': '$recipient', 'ref': '$classic' } }, 'count': { '$sum': 1 } } },
          { '$unwind': '$data' },
          {
            '$project': {
              '_id': '$data.rs._id',
              'content': "$data.rs.content",
              'creator_id': "$data.rs.creator_id",
              'created_date': "$data.rs.created_date",
              'username': '$data.us.username',
              'remark': '$data.rec.remark',
              'ref_id': '$data.ref._id',
              'ref_title': '$data.ref.title',
              'ref_summary': '$data.ref.summary',
              'count': 1
            }
          },
          { '$sort': { 'created_date': -1 } },
          { "$limit": 20 }
        ],
        'as': 'replies'
      }},
      { '$match': { '_id': troubleId }},
      { '$project': {
        '_id': 1,
        'content': 1,
        'replies': '$replies',
        'creator_id': 1,
        'last_reply_date': 1,
        'created_date': 1,
        'username': '$user.username',
        // 'remark': '$recipient.remark',
        'reply_count': { '$max': '$replies.count'}
      }},
      { '$sort': { 'last_reply_date': -1, 'created_date': -1 } },
      { '$skip' : skip },
      { "$limit": limit }
    ]
  )
  
  let help = helps && helps.length && helps[0]

  await ctx.fullRender('help', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    troubleHolder: constant.TROUBLE_HOLDER,
    noDataTips: constant.NO_MINE_TROUBLE,
    features: constant.FEATURES,
    pageInfo: {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage: page < totalPage ? page + 1 : 0,
    },
    help,
    info
  })

  ctx.session.info = null
})

// 获得推荐时的忧扰
router.get('/recommend/helps', async (ctx, next) => {
  let { user } = ctx.state

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 我的烦恼总数
  let totalPage = Math.ceil(0 / limit)

  let info = ctx.session.info
  let helps = await Trouble.aggregate(
    [
      { '$lookup': {
        'from': Friend.collection.name,
        'let': { 'creator_id': '$creator_id' },
        'pipeline': [{ 
          '$match': { 
            'recipient': user._id,
            "$expr": { "$eq": [ "$requester", "$$creator_id" ] }
          }
        }],
        'as': 'requester'
      }},
      { '$lookup': {
        'from': Friend.collection.name,
        'let': { 'creator_id': '$creator_id' },
        'pipeline': [{ 
          '$match': { 
            'requester': user._id,
            "$expr": { "$eq": [ "$recipient", "$$creator_id" ] }
          }
        }],
        'as': 'recipient'
      }},
      { '$lookup': {
        'from': User.collection.name,
        'localField': 'creator_id',
        'foreignField': '_id',
        'as': 'user'
      }},
      { '$match': {  "$expr": { '$or': [{ '$and': [{ '$eq': [{ '$min': '$recipient.status' }, 3] }, { '$eq': [{ '$min':'$requester.status' }, 3] }] }, {'$eq': ['$creator_id', user._id]}]}}},
      { '$project': {
        '_id': 1,
        'content': 1,
        'creator_id': 1,
        'last_reply_date': 1,
        'created_date': 1,
        'username': '$user.username',
        'remark': '$recipient.remark'
      }},
      { '$sort': { 'last_reply_date': -1, 'created_date': -1 } },
      { '$skip' : skip },
      { "$limit": limit }
    ]
  )
  
  ctx.body = {
    success: true,
    pageInfo: {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage: page < totalPage ? page + 1 : 0,
    },
    helps,
    info
  }
})

// 原创分享
router.get('/features/share', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 来源页错误信息
  let info = ctx.session.info

  // 烦恼总数
  let total = await Share.estimatedDocumentCount()
  let totalPage = Math.ceil(total / limit)

  // 查找所有烦恼
  let shares = await Share.find({})
    .sort({ created_date: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  shares.map(share => {
    if (share.column_id) {
      const key = share.column_id.toUpperCase()
      share.name = constant.COLUMNS[key].name
    }
    return share
  })

  // 感恩状态
  let { user } = ctx.state
  if (user && user.id) {
    let shareIds = shares.map(share => share._id)
    let thanks = await Thank.find({
      basis_id: { $in: shareIds },
      giver_id: user.id
    }).lean()
    shares = shares.map(share => {
      share.isThanked = thanks.findIndex(
        thank => thank.basis_id.equals(share._id)) > -1
      return share
    })
  }

  // 返回并渲染首页
  await ctx.fullRender('shares', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    shareHolder: constant.SHARE_HOLDER,
    features: constant.FEATURES,
    columns: constant.COLUMNS,
    shareColumnHolder: constant.SHARE_COLUMN_HOLDER,
    pageInfo: {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage: page < totalPage ? page + 1 : 0,
    },
    shares,
    info
  })

  ctx.session.info = null
})

// 获得板块分享
router.get('/column/:id', async (ctx, next) => {
  
  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  let columnId = ctx.params.id,
  condition = columnId === 'all'? {} : { column_id:  columnId }

  // 分享总数
  let total = await Share.countDocuments(condition)
  let totalPage = Math.ceil(total / limit)

  // 查找所有分享
  let shares = await Share.find(condition)
    .sort({ created_date: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    
  if (columnId === 'all'){
    shares.map(share => {
      if (share.column_id) {
        const key = share.column_id.toUpperCase()
        share.name = constant.COLUMNS[key].name
      }
      return share
    })
  }

  // 感恩状态
  let { user } = ctx.state
  if (user && user.id) {
    let shareIds = shares.map(share => share._id)
    let thanks = await Thank.find({
      basis_id: { $in: shareIds },
      giver_id: user.id
    }).lean()
    shares = shares.map(share => {
      share.isThanked = thanks.findIndex(
        thank => thank.basis_id.equals(share._id)) > -1
      return share
    })
  }

  ctx.body = {
    success: true,
    user,
    pageInfo: {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage: page < totalPage ? page + 1 : 0,
    },
    shares,
  }
})

// 分享内容页
router.get('/share/:id', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 查找所有烦恼
  let share = await Share.findById(
    ctx.params.id)
    .select('_id title content')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('share', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    share,
    backPage: '/features/share',
    info
  })

  ctx.session.info = null
})

// 分享编辑页
router.get('/share/:id/modify', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 查找所有烦恼
  let share = await Share.findById(
    ctx.params.id)
    .select('_id column_id title content')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('sharemodify', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    shareHolder: constant.SHARE_HOLDER,
    shareColumnHolder: constant.SHARE_COLUMN_HOLDER,
    features: constant.FEATURES,
    columns: constant.COLUMNS,
    share,
    backPage: '/features/share',
    info
  })

  ctx.session.info = null
})

// 引经据典
router.get('/features/classic', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 来源页错误信息
  let info = ctx.session.info

  // 烦恼总数
  let total = await Share.estimatedDocumentCount()
  let totalPage = Math.ceil(total / limit)

  // 查找所有烦恼
  let classics = await Classic.find({})
    .select('_id title summary creator_id')
    .sort({ created_date: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('classics', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    noDataTips: constant.NO_CLASSICS,
    pageInfo: {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage: page < totalPage ? page + 1 : 0,
    },
    classics,
    classic: null,
    info
  })

  ctx.session.info = null
})

// 引经内容页
router.get('/classic/:id', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 查找所有烦恼
  let classic = await Classic.findById(
    ctx.params.id)
    .select('_id title poster summary content')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('classic', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    classic,
    backPage: '/features/classic',
    info
  })

  ctx.session.info = null
})

// 引经据典编辑页
router.get('/classic/:id/modify', async (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 查找所有烦恼
  let classic = await Classic.findById(
    ctx.params.id)
    .select('_id title poster summary content')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('classicmodify', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    classicHolder: constant.CLASSIC_HOLDER,
    features: constant.FEATURES,
    columns: constant.COLUMNS,
    classic,
    backPage: '/features/classic',
    info
  })

  ctx.session.info = null
})

// 设置
router.get('/config', async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_COMMENT_PAGE
    ].join('——')
  })

  let info = ctx.session.info
  await ctx.fullRender('config', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    info
  })

  ctx.session.info = null
})

// 添加日记
router.post('/diary', async (ctx) => {
  const { content = '' } = ctx.request.body
  const { user } = ctx.state
  try {
    await Diary.create({ 
      content,
      creator_id: user.id
    })
  } catch (err) {
    ctx.session.info = filterMsg(err.message)
  }
  ctx.redirect('/features/diary')
  ctx.status = 302
})

// 添加烦恼
router.post('/trouble', async (ctx) => {
  const { content } = ctx.request.body
  const { user } = ctx.state
  try {
    await Trouble.create({ 
      content,
      creator_id: user.id
    })
  } catch (err) {
    ctx.session.info = filterMsg(err.message)
  }
  ctx.redirect('/features/help')
  ctx.status = 302
})

// 原创分享
router.post('/share', async (ctx) => {
  const { content, title, column_id } = ctx.request.body
  const { user } = ctx.state
  try {
    await Share.create({ 
      title,
      content,
      creator_id: user.id,
      column_id
    })
  } catch (err) {
    ctx.session.info = err.message
  }
  ctx.redirect('/features/share')
  ctx.status = 302
})

// 原创分享修改
router.put('/share/:id', async (ctx) => {
  const { content, title } = ctx.request.body
  const { user } = ctx.state
  try {
    await Share.updateOne({
      _id: ctx.params.id,
      creator_id: user._id
    }, { 
      $set: { title, content },
    }, { 
      runValidators: true 
    })
    ctx.body = {
      success: true,
    }
  } catch (err) {
    ctx.body = {
      success: false,
      info: err.message
    }
  }
})

// 引经据典
router.post('/classic', async (ctx) => {
  const { title, poster, summary, content } = ctx.request.body
  const { user } = ctx.state
  try {
    await Classic.create({ 
      title,
      poster,
      summary,
      content,
      creator_id: user.id
    })
  } catch (err) {
    ctx.session.info = err.message
  }
  ctx.redirect('/features/classic')
  ctx.status = 302
})

// 引经据典修改
router.put('/classic/:id', async (ctx) => {
  const { title, poster, summary, content } = ctx.request.body
  const { user } = ctx.state
  try {
    await Classic.updateOne({
      _id: ctx.params.id,
      creator_id: user._id
    }, { 
      $set: { title, poster, summary, content },
    }, { 
      runValidators: true 
    })
    ctx.body = {
      success: true,
    }
  } catch (err) {
    ctx.body = {
      success: false,
      info: err.message
    }
  }
})

// 感恩
router.post('/thank/:shareId', async (ctx, next) => {
  const { shareId } = ctx.params
  const { user } = ctx.state
  let share = await Share.findOneAndUpdate(
    { _id: shareId },
    { $inc: { thank: 1 } }
  )
  await Thank.create({
    giver_id: user.id,
    winner_id: share.creator_id,
    basis_id: shareId,
  })
  ctx.body = {
    success: true
  }
})

// 回复
router.post('/:type/:id/reply', async (ctx, next) => {
  const { 
    content, 
    parent_id, 
    parent_type,
    receiver_id,
    ref_id 
  } = ctx.request.body
  let { type, id } = ctx.params
  try {
    let reply = await Reply.create({ 
      content, 
      reply_id: id,
      reply_type: type,
      parent_id,
      parent_type,
      creator_id: ctx.state.user.id,
      receiver_id,
      ref_id
    })
    ctx.body = {
      success: true
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// 发送添加知己请求
router.post('/friend/:id/send', async (ctx, next) => {
  const { user } = ctx.state,
  { id } = ctx.params,
  { remark, content } = ctx.request.body

  // 不能添加自己为知己
  if (user._id.equals(id)){
    ctx.body = {
      success: false,
      message: constant.FRIEND_CANNOT_MINESELF
    }
    return
  }

  try {
    let recipient_id = mongoose.Types.ObjectId(id)
    let relations = await Friend.aggregate(
      [
        { '$lookup': {
          'from': Friend.collection.name,
          'pipeline': [{ 
            '$match': { 
              'requester': recipient_id, 
              'recipient': user._id 
            }
          }],
          'as': 'friend'
        }},
        { '$unwind': "$friend" },
        { '$match': { 
          'requester': user._id, 
          'recipient': recipient_id 
        } },
        { '$project': {
          'status': 1,
          'recipient_status': '$friend.status'
        }}
      ]
    )

    let relation = relations[0] || {}

    // 对方已经是自己知己
    if (relation.status === 3 && relation.recipient_status === 3) {
      ctx.body = {
        success: false,
        message: constant.FRIEND_EXISTS
      }
      return
    }
    
    // 您已经发起了将对方添加为知己的申请
    if (relation.status === 1 && relation.recipient_status === 2) {
      ctx.body = {
        success: false,
        message: constant.OTHER_FRIEND_REQUESTING
      }
      return
    }

    // 对方正在申请您为知己
    if (relation.status === 2 && relation.recipient_status === 1) {
      ctx.body = {
        success: false,
        message: constant.MINE_FRIEND_REQUESTING
      }
      return
    }
  
    // 更新知己状态
    await Friend.updateOne(
      { requester: user.id, recipient: id },
      { $set: { status: 1, remark }},
      { upsert: true, new: true }
    )
    await Friend.updateOne(
      { recipient: user.id, requester: id },
      { $set: { status: 2, content }},
      { upsert: true, new: true }
    )
    ctx.body = {
      success: true
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// 同意添加知己请求
router.put('/friend/:id/accept', async (ctx, next) => {
  const { user } = ctx.state,
  { id } = ctx.params,
  { remark } = ctx.request.body

  // 不能添加自己为知己
  if (user._id.equals(id)){
    ctx.body = {
      success: false,
      message: constant.FRIEND_CANNOT_MINESELF
    }
    return
  }

  try {
    let recipient_id = mongoose.Types.ObjectId(id)
    let relations = await Friend.aggregate(
      [
        { '$lookup': {
          'from': Friend.collection.name,
          'pipeline': [{ 
            '$match': { 
              'requester': recipient_id, 
              'recipient': user._id 
            }
          }],
          'as': 'friend'
        }},
        { '$unwind': "$friend" },
        { '$match': { 
          'requester': user._id, 
          'recipient': recipient_id 
        } },
        { '$project': {
          'status': 1,
          'recipient_status': '$friend.status'
        }}
      ]
    )

    let relation = relations[0] || {}

    // 对方已经是自己知己
    if (relation.status === 3 && relation.recipient_status === 3) {
      ctx.body = {
        success: false,
        message: constant.FRIEND_EXISTS
      }
      return
    }
    
    // 当对方发起了对我的请求时
    if (relation.status === 2 && relation.recipient_status === 1) {
      await Friend.updateOne(
        { requester: user.id, recipient: id },
        { $set: { status: 3, remark }}
      )
      await Friend.updateOne(
        { recipient: user.id, requester: id },
        { $set: { status: 3 }}
      )

      ctx.body = {
        success: true
      }
    } else {
      ctx.body = {
        success: false,
        message: constant.OTHER_FRIEND_NOT_REQUESTING
      }
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// 删除知己关系
router.delete('/friend/:id/remove', async (ctx, next) => {
  const { user } = ctx.state,
  { id } = ctx.params,
  { content } = ctx.request.body

  try {
    let recipient_id = mongoose.Types.ObjectId(id)
    let relations = await Friend.aggregate(
      [
        { '$lookup': {
          'from': Friend.collection.name,
          'pipeline': [{ 
            '$match': { 
              'requester': recipient_id, 
              'recipient': user._id 
            }
          }],
          'as': 'friend'
        }},
        { '$unwind': "$friend" },
        { '$match': { 
          'requester': user._id, 
          'recipient': recipient_id 
        } },
        { '$project': {
          'status': 1,
          'recipient_status': '$friend.status'
        }}
      ]
    )

    let relation = relations[0] || {}

    await Friend.deleteOne(
      { requester: user.id, recipient: id }
    )

    let isFriend = (relation.status === 3 && relation.recipient_status === 3)
    let isPending = (relation.status === 2 && relation.recipient_status === 1)
    if (!isFriend && !isPending) {
      await Friend.deleteOne(
        { recipient: user.id, requester: id }
      )
    } else {
      if (isPending) {
        await Friend.updateOne(
          { recipient: user.id, requester: id },
          { $set: { content } }
        )
      }
    }

    ctx.body = {
      success: true
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// 删除记录
router.delete('/diary/:id', async (ctx, next) => {
  try {
    let res = await Diary.deleteOne({
      creator_id: ctx.state.user.id,
      _id: ctx.params.id
    })
    if (res.ok && res.n) {
      ctx.body = {
        success: true
      }
    } else {
      ctx.body = {
        success: false,
        message: '删除失败'
      }
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// 消除烦恼
router.delete('/trouble/:id', async (ctx, next) => {
  // 烦恼删除后，回复要被回收器自动清理
  try {
    let res = await Trouble.deleteOne({
      creator_id: ctx.state.user.id,
      _id: ctx.params.id
    })
    if (res.ok && res.n) {
      ctx.body = {
        success: true
      }
    } else {
      ctx.body = {
        success: false,
        message: '删除失败'
      }
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// 删除分享
router.delete('/share/:id', async (ctx, next) => {
  try {
    let res = await Share.deleteOne({
      creator_id: ctx.state.user.id,
      _id: ctx.params.id
    })
    if (res.ok && res.n) {
      ctx.body = {
        success: true
      }
    } else {
      ctx.body = {
        success: false,
        message: '删除失败'
      }
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// 删除经典
router.delete('/classic/:id', async (ctx, next) => {
  try {
    let res = await Classic.deleteOne({
      creator_id: ctx.state.user.id,
      _id: ctx.params.id
    })
    if (res.ok && res.n) {
      ctx.body = {
        success: true
      }
    } else {
      ctx.body = {
        success: false,
        message: '删除失败'
      }
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// 删除回复
router.delete('/reply/:id', async (ctx, next) => {
  try {
    let res = await Reply.deleteOne({
      creator_id: ctx.state.user.id,
      _id: ctx.params.id
    })
    if (res.ok && res.n) {
      ctx.body = {
        success: true
      }
    } else {
      ctx.body = {
        success: false,
        message: '删除失败'
      }
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(port, () => {
  console.log(`Tianye app starting at port ${port}`)
})

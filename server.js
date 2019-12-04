require('dotenv').config()

const fs = require('fs')
const http = require('http')
const https = require('https')
const enforceHttps = require('koa-sslify').default
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
const Party = require('./models/party')
const Verification = require('./models/verification')
const Mind = require('./models/mind')
const Keyword = require('./models/keyword')
const FeatureVisitor = require('./models/feature_visitor')
const Visitor = require('./models/visitor')
const Version = require('./models/version')
const Classic = require('./models/classic')
const Section = require('./models/section')
const Translate = require('./models/translate')
const Reply = require('./models/reply')
const Friend = require('./models/friend')
const session = require('koa-session')
const { pageRange, getDate, pbkdf2, clearFormat, /*getClientIP*/ } = require('./utils')
const crypto = require('crypto')
const path = require('path')
const { staticDir } = require('./config/remotepath')
const phoneToken = require('generate-sms-verification-code')
const utils = require('./utils')
const signature = require('./signature')
const qiniu = require('qiniu')
const formidable = require('formidable')
const shortid = require('shortid')
// const geoip = require('geoip-lite');
// 阿里短信服务框架
const Core = require('@alicloud/pop-core')

// 创建一个短信服务器
const client = new Core({
  accessKeyId: 'LTAI7hLDpz0eSRu8',
  accessKeySecret: 'mKiv8FKXNucI0tXz20qXzT2F3rljfg',
  endpoint: 'https://dysmsapi.aliyuncs.com',
  apiVersion: '2017-05-25'
});

const app = new Koa()
const router = new Router()
const port = process.env.PORT || 3000

if (process.env.NODE_ENV === 'production') {
  // Force HTTPS on all page
  app.use(enforceHttps())
} else {
  const webpack = require('webpack')
  const { koaDevMiddleware, koaHotMiddleware } = require('./hmr')
  const webpackDevConfig = require('./webpack.config.dev')
  const webpackCompiler = webpack(webpackDevConfig)

  app.use(koaDevMiddleware(webpackCompiler, {
    noInfo: true,
    publicPath: webpackDevConfig.output.publicPath
  }))
  app.use(koaHotMiddleware(webpackCompiler, {
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000,
  }))
}

//连接mongodb 数据库 ，地址为mongodb的地址以及集合名称。
const dbLink = process.env.DBLINK || 'mongodb://localhost:27018/tianye'
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true)
mongoose.connect(dbLink, { useNewUrlParser: true, useFindAndModify: false })

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
  console.log()
  //let ip = getClientIP(ctx.req)
  //let geo = geoip.lookup(ip)
  let user = ctx.cookies.request.user
  let cssExt = 'css'
  ctx.state.env = process.env.NODE_ENV
  ctx.state.is_wechat = false
  ctx.state.need_auto_script = true
  ctx.state.need_dom4_script = true
  ctx.state.need_global_script = true
  ctx.state.icpCode = constant.ICP_CODE
  ctx.state.user = user || null
  ctx.state.globalStyleFile = `${staticDir[cssExt]}global.${cssExt}`
  ctx.state.friendName = constant.FRIEND_NAME
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

// 记录当前页面url状态
router.get([
  '/',
  'about',
  '/appdownload',
  '/mind/:id',
  '/karma/fate',
  '/karma/talk',
  '/help/:id',
  '/classic/:id',
  '/karma/friend',
  '/mind/create',
  '/classic/create',
  '/knowledge/create',
], (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  return next()
})

// 访问需要验证用户
router.get([
  '/notification',
  '/mind',
  '/karma/talk',
  '/karma/friend',
  '/karma/fate',
  '/user/search',
  '/help/:id',
  '/recommend/helps',
  '/mind/create',
  '/mind/:id/modify',
  '/classic/create',
  '/knowledge/create',
  '/classic/:id/modify',
  '/classic/:id/section/create',
  '/section/:id/modify',
  '/section/:id/translate/create',
  '/translate/:id/modify',
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
  '/mind',
  '/mind/:id',
  '/thank/:mindId',
  '/reply/:id',
  '/:type/:id/reply',
  '/classic',
  '/classic/:id',
  '/classic/:id/section',
  '/section/:id',
  '/section/:id/translate',
  '/translate/:id',
  '/friend/:id/send',
  '/friend/:id/accept',
  '/friend/:id/remove',
  '/nickname',
  '/password',
  '/uploadImg',
  '/uploadAudio',
  '/uploadVideo',
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

// 下载
router.get('/download', async (ctx, next) => {
  let { type } = ctx.request.query
  , versions = await Version.find({
    type
  }).limit(1).sort({ version_code: -1 })
  , version = versions && versions.length && versions[0]
  ctx.redirect(version.url || '/')
})

// 版本升级
router.get('/version', async (ctx, next) => {
  let { type } = ctx.request.query
  , versions = await Version.find({
    type
  }).limit(1).sort({ version_code: -1 })
  , version = versions && versions.length && versions[0]
  if (version) {
    ctx.body = {
      url: version.url,
      versionCode: version.version_code,
      updateMessage: version.update_message
    }
  } else {
    ctx.body = {
      success: false
    }
  }
})

// 分享权限文件
router.get([
  '/MP_verify_7EpOZxwd2wwc5bGT.txt', 
  '/mind/MP_verify_7EpOZxwd2wwc5bGT.txt'
], (ctx, next) => {
  ctx.set('Content-disposition','attachment;filename='+'MP_verify_7EpOZxwd2wwc5bGT.txt')
  const data = new Buffer('7EpOZxwd2wwc5bGT')
  ctx.body = data
})

// 登录页
router.get('/login', async (ctx) => {
  ctx.session.currentFormUrl = '/login'
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.SITE_SIGNIN_PAGE,
      constant.APP_NAME, 
    ].join('——')
  })

  const info = ctx.session.info
  await ctx.fullRender('login', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    phoneHolder: constant.PHONE_HOLDER,
    passwordHolder: constant.PASSWORD_HOLDER,
    info
  })

  ctx.session.info = null
})

function loginPromise(ctx, way) {
  return new Promise((resove, reject) => {
    passport.authenticate(way, (err, user, info, status) => {
      if (err) {
        resove({
          success: false,
          info: err.message
        })
      } else {
        if (!user) {
          const info = constant.USER_NOT_EXISTS
          resove({
            success: false,
            info
          })
        } else {
          ctx.login(user, (err) => {
            if (err) {
              resove({
                success: false,
                info: err.message
              })
            } else {
              resove({
                success: true,
                user
              })
            }
          })
        }
      }
    })(ctx)
  })  
}

// 登录
router.post('/login', async (ctx) => {
  let { way } = ctx.request.body
  if (!way) {
    ctx.body = {
      success: false,
      info: constant.MISS_PARAMS
    }
    return
  }

  let loginRes = await loginPromise(ctx, way)
  let { success, info, user } = loginRes
  if (success) {
    if (ctx.state.isXhr) {
      let notification = await getNotification(user._id)
      loginRes.notification = notification
      ctx.body = loginRes
    } else {
      const { currentUrl } = ctx.session
      if (currentUrl) {
        ctx.redirect(currentUrl)
        ctx.session.currentUrl = null
      } else {
        ctx.redirect('/')
      }
    }
  } else {
    if (ctx.state.isXhr) {
      ctx.body = loginRes
    } else {
      ctx.session.info = info
      ctx.redirect('/login')
    }
  }
})

router.get('/logout', function(ctx) {
  ctx.logout()

  if (ctx.state.isXhr) {
    ctx.body = {
      success: true,
      info: '登出成功'
    }
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

// 注册页
router.get('/signup', async (ctx) => {
  ctx.session.currentFormUrl = '/signup'
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.SITE_SIGNUP_PAGE,
      constant.APP_NAME, 
    ].join('——')
  })

  await ctx.fullRender('signup', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    partynameHolder: constant.PARTYNAME_HOLDER,
    passwordHolder: constant.PASSWORD_HOLDER,
    phoneHolder: constant.PHONE_HOLDER,
    info: ctx.session.info
  })

  ctx.session.info = null
})

// 注册
router.post('/signup', async (ctx, next) => {
  let { 
    partyname = '', 
    password = '',
    phone = '', 
    code = ''
  } = ctx.request.body

  partyname = partyname.trim()
  phone = phone.trim()
  code = code.trim()
  let vcode = await Verification.findOne({ 
    phone,
    code
  }, 'phone code').lean()

  if (!vcode) {
    if (ctx.state.isXhr) {
      ctx.body = {
        success: false,
        info: constant.VCODE_ERROR
      }
    } else {
      ctx.session.info = constant.VCODE_ERROR
      ctx.redirect('/signup')
    }
    return
  }

  let user = await User.findOne({
    phone
  }, 'phone').lean()

  if (user) {
    let errmsg = constant.PHONE_EXISTS
    if (ctx.state.isXhr) {
      ctx.body = {
        success: false,
        info: errmsg
      }
    } else {
      ctx.session.info = errmsg
      ctx.redirect('/signup')
    }
  } else {
    let buf = await crypto.randomBytes(32)
    , salt = buf.toString('hex')
    , hash = await pbkdf2(password, salt)
    let newUser = await User.create({
      username: phone,
      phone,
      hash: new Buffer(hash, 'binary').toString('hex'),
      salt: salt
    })
    await Party.create({
      name: partyname,
      creator_id: newUser._id
    })
    await Verification.deleteOne({ 
      phone,
      code: code
    })
    let loginRes = await loginPromise(ctx, 'local')
    , { success, info, user } = loginRes
    if (success) {
      if (ctx.state.isXhr) {
        let notification = await getNotification(user._id)
        loginRes.notification = notification
        ctx.body = loginRes
      } else {
        const { currentUrl } = ctx.session
        if (currentUrl) {
          ctx.redirect(currentUrl)
          ctx.session.currentUrl = null
        } else {
          ctx.redirect('/')
        }
      }
    } else {
      if (ctx.state.isXhr) {
        ctx.body = loginRes
      } else {
        ctx.session.info = info
        ctx.redirect('/signup')
      }
    }
  }
})

// 发送验证码
router.post('/phone/vcode',async (ctx)=>{
  let {
    phone = '',
    phone_number = '',
    country = '',
    type
  } = ctx.request.body
  phone = phone.trim()
  phone_number = phone_number.trim()
  country = country.trim()
  // 是否为国际
  const isForeign = country !== 'CN'

  // 参数错误
  if (!type) {
    ctx.body = {
      success: false,
      info: constant.MISS_PARAMS
    }
    return
  }

  // 注册需要验证用户是否已经被注册
  if (type === 'signup') {
    let user = await User
    .findOne({ phone }, 'phone')
    .lean()
    if (user) {
      ctx.body = {
        success: false,
        info: constant.PHONE_EXISTS
      }
      return
    }
  }

  let code = ''
  let verification = await Verification
  .findOne({ phone }, 'code')
  .lean()
  if (verification && verification.code) {
    code = verification.code
  } else {
    // 生成验证码并发送到邮箱
    code = await phoneToken(6, {type: 'string'})
  }

  // 保存匹配验证码记录
  await Verification.updateOne(
    { phone },
    { $set: { 
      phone, 
      code, 
      createdAt: new Date() 
    }},
    { 
      runValidators: true,
      upsert: true
    }
  )

  try {
    /* let p = () => new Promise((res, rej) => {
      setTimeout(() => {
        console.log(code)
        res(code)
      }, 3000)
    })
    await p() */
    // 发送短信验证码
    let templateCode = ''
    switch(type) {
      case 'signup':
        templateCode = isForeign ? "SMS_173341730" : "SMS_173341738"
        break
      case 'login':
        templateCode = isForeign ? "SMS_173346747" : "SMS_173341739"
        break
      case 'reset':
        templateCode = isForeign ? "SMS_173346746" : "SMS_166080267"
        break
    }
    let fullPhone = phone.split('-').join('')
    let params = {
      "RegionId": "cn-hangzhou",
      "PhoneNumbers": isForeign ? fullPhone : phone_number,
      "SignName": "田野耘心",
      "TemplateCode": templateCode,
      "TemplateParam": JSON.stringify({
        code: code
      })
    }

    // if (isForeign) params.CountryCode = country 
    
    var requestOption = {
      method: 'POST'
    };
    
    await client.request('SendSms', params, requestOption)
    ctx.body = {
      success: true
    }
  } catch (err) {
    ctx.body = {
      success: false,
      info: '发送手机验证码失败。'
    }
  }
})

// 首页
// 引经据典
router.get('/classic', async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [
      '网友推荐',
      constant.APP_NAME, 
    ].join('——'),
  })

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 来源页错误信息
  let info = ctx.session.info

  // 著作总数
  let total = await Classic.estimatedDocumentCount()
  let totalPage = Math.ceil(total / limit)
  let pageInfo = null

  const nextPage = page < totalPage ? page + 1 : 0
  if (ctx.state.isXhr) {
    pageInfo = {
      nextPage
    }
  } else {
    pageInfo = {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage
    }
  }

  // 查找所有烦恼
  let classics = await Classic.find({})
    .select('_id title poster summary creator_id mind_id updated_date')
    .populate('author', 'nickname')
    .populate('mind', 'content')
    .sort({ updated_date: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('classics', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    noDataTips: constant.NO_CLASSICS,
    pageInfo,
    classics,
    info
  })

  ctx.session.info = null
})

// app下载页
router.get('/about', (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [ constant.SITE_ABOUT_PAGE, constant.APP_NAME, ].join('——'),
    need_auto_script: false,
    need_global_script: false
  })

  return ctx.fullRender('about', {
    appName: constant.APP_NAME
  })
})

// app下载页
router.get('/appdownload', (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: constant.APP_NAME,
  })

  return ctx.fullRender('index', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN
  })
})

// 更新密码
router.put('/password', async (ctx, next) => {
  let user = await User.findById(ctx.state.user._id, 'hash salt')
  , { 
    password_old = '', 
    password_new = '', 
    password_re = '' 
  } = ctx.request.body
  await user.updatePassword(
    password_old, 
    password_new, 
    password_re
  )
  ctx.body = {
    success: true,
    info: '更新密码成功'
  }
})

// 重置密码
router.put('/reset', async (ctx, next) => {
  let { 
    new_password = '',
    phone = '', 
    code = ''
  } = ctx.request.body
  phone = phone.trim()
  code = code.trim()

  // 验证邮箱验证码
  let vcode = await Verification.findOne({ 
    phone: phone,
    code: code
  }, 'phone code').lean()
  if (!vcode) {
    ctx.body = {
      success: false,
      info: constant.VCODE_ERROR
    }
    return
  }

  // 验证是否填写了新密码
  if (!new_password) {
    throw new Error(constant.MISSING_PASSWORD_ERROR)
  }

  // 重置密码
  let buf = await crypto.randomBytes(32)
  , salt = buf.toString('hex')
  , hash = await utils.pbkdf2(new_password, salt)
  await User.updateOne(
    { phone },
    { $set : {
      hash: new Buffer(hash, 'binary').toString('hex'),
      salt
    } },
    { 
      runValidators: true
    }
  )
  ctx.body = {
    success: true,
    info: '重设密码成功'
  }
})

// 获取消息
async function getNotification(uid) {
  // 查找“心”消息提示
  let mindReplyNew = await Mind.aggregate([
    { $match: {
      creator_id: uid
    }},
    Visitor.queryVisitor(uid),
    { $lookup: {
      from: Reply.collection.name,
      let: { 'mind_id': '$_id' },
      pipeline: [
        ...Friend.friendshipQuery(uid),
        Friend.newReplyfriendshipMatch(uid),
        { $project: {
          created_date: 1
        }},
        { $sort: { created_date: -1 } },
        { $limit: 1 }
      ],
      as: 'reply'
    }},
    { $project: {
      reply: 1,
      visitor: { $cond : [ { $eq : ['$visitor', []]}, [ null ], '$visitor'] },
      created_date: 1
    }},
    { $unwind: '$visitor' },
    { $unwind: '$reply' },
    { $project: {
      reply: 1,
      visited_date: { $cond : [ { $ne : ['$visitor', null]}, '$visitor.visited_date', '$created_date'] },
    }},
    { $match: { 
      $expr: { $gt: [ '$reply.created_date',  '$visited_date' ] }
    }},
    { $count: 'total' }
  ])

  // 查找“缘”消息提示
  let karmaVisit = await FeatureVisitor.find({
    visitor_id: uid,
    feature: { $in: ['talk', 'friend', 'fate'] }
  }, 'feature visited_date')

  let talkVisit = null
  , friendVisit = null
  , fateVisit = null
  if (karmaVisit && karmaVisit.length) {
    talkVisit = karmaVisit.find(visit => visit.feature === 'talk')
    friendVisit = karmaVisit.find(visit => visit.feature === 'friend')
    fateVisit = karmaVisit.find(visit => visit.feature === 'fate')
  }

  let friendshipMatch = Friend.friendshipMatch()

  // 查找“缘谈心”消息提示
  let talkReplyNew = await Mind.aggregate([
    ...Friend.friendshipQuery(uid),
    { $unwind: '$recipient'},
    { $unwind: '$requester'},
    friendshipMatch,
    Visitor.queryVisitor(uid),
    { $lookup: {
      from: Reply.collection.name,
      let: { 'mind_id': '$_id' },
      pipeline: [
        ...Friend.friendshipQuery(uid),
        Friend.newReplyfriendshipMatch(uid),
        { $sort: { created_date: -1 } },
        { $limit: 1 }
      ],
      as: 'reply'
    }},
    { $project: {
      reply: 1,
      visitor: { $cond : [ { $eq : ['$visitor', []]}, [ null ], '$visitor'] },
      created_date: 1
    }},
    { $unwind: '$visitor' },
    { $unwind: '$reply' },
    { $project: {
      reply: 1,
      visited_date: { $cond : [ { $ne : ['$visitor', null]}, '$visitor.visited_date', '$created_date'] },
    }},
    { $match: { 
      $expr: {
        $gt: [ '$reply.created_date',  '$visited_date' ] 
      }
    }},
    { $count: 'total' }
  ])

  friendshipMatch.$match.$expr.$and.push({
    $gt: [ '$created_date',  talkVisit && talkVisit.visited_date || null ]
  })
  let karmaTalkNew = await Mind.aggregate([
    ...Friend.friendshipQuery(uid),
    { $unwind: '$recipient'},
    { $unwind: '$requester'},
    friendshipMatch,
    { $count: 'total' }
  ])

  // 查找“知己”消息提示
  let friendNew = await Friend.aggregate(
    [
     { $lookup: {
        from: Friend.collection.name,
        let: { 'recipient': '$recipient' },
        pipeline: [
          { $match: { 
            recipient: uid, 
            $expr: { $eq: [ '$requester', '$$recipient' ] }
          }},
        ],
        as: 'friend'
      }},
      { $unwind: '$friend' },
      { $project: {
        requester: 1,
        status: 1,
        recipient_status: '$friend.status',
        updatedAt: 1
      }},
      { $match: { 
        requester: uid,
        $expr: {
          $and: [{
            $or: [{
              $and: [
                { 
                  $eq: ['$status', 3]
                }, { 
                  $eq: ['$recipient_status', 3] 
                }
              ]
            }, {
              $and: [
                { 
                  $eq: ['$status', 2]
                }, { 
                  $eq: ['$recipient_status', 1] 
                }
              ]
            }]
          }, {
            $gt: [ '$updatedAt',  friendVisit && friendVisit.visited_date || 0 ]
          }]
        }
      }},
      { $count: 'total' }
    ]
  )

  // 查找“投缘”消息提示
  let fateMatch = Friend.neReqfriendMatch()
  fateMatch.$match.$expr.$and.push(
    { $eq: [ '$type', 'emotion'] },
    { $eq: [ '$receiver_id', uid ] },
    { $gt: [ '$created_date', fateVisit && fateVisit.visited_date || 0 ] }
  )
  , fateNew = await Reply.aggregate([
    ...Friend.friendshipQuery(uid),
    fateMatch,
    { $count: 'total' }
  ])

  // 序列化消息返回
  let notification = []
  let mindReplyCount = mindReplyNew && mindReplyNew[0] && mindReplyNew[0].total || 0
  mindReplyCount && notification.push({
    feature: 'mind',
    has_new: true,
    toatl: mindReplyCount
  })

  let talkReplyCount = talkReplyNew && talkReplyNew[0] && talkReplyNew[0].total || 0
  let karmaTalkCount = karmaTalkNew && karmaTalkNew[0] && karmaTalkNew[0].total || 0
  let friendNewCount = friendNew && friendNew[0] && friendNew[0].total || 0
  let fateNewCount = fateNew && fateNew[0] && fateNew[0].total || 0
  // console.log(fateNewCount)
  if (talkReplyCount || karmaTalkCount || friendNewCount || fateNewCount) {
    let karmaMsg = {
      feature: 'karma',
      has_new: true,
      sub_feature: [], 
    }
    if (talkReplyCount || karmaTalkCount) {
      karmaMsg.sub_feature.push({
        feature: 'talk',
        reply_total: talkReplyCount,
        mind_total: karmaTalkCount,
        has_new: true
      })
    }
    if (friendNewCount) {
      karmaMsg.sub_feature.push({
        feature: 'friend',
        total: friendNewCount,
        has_new: true
      })
    } 
    if (fateNewCount) {
      karmaMsg.sub_feature.push({
        feature: 'fate',
        total: fateNewCount,
        has_new: true
      })
    }
    notification.push(karmaMsg)
  }

  return notification
}

// 返回小红点数据
router.get('/notification', async (ctx, next) => {
  const { user } = ctx.state
  const uid = user._id

  let notification = await getNotification(uid)

  ctx.body = {
    success: true,
    notification
  }
})

// 知己
router.get('/karma/friend', async (ctx, next) => {
  let { query } = ctx.request
  let { user } = ctx.state
  
  let friends = await Friend.aggregate(
    [
     { $lookup: {
        from: Friend.collection.name,
        let: { 'recipient': '$recipient' },
        pipeline: [
          { $match: { 
            recipient: user._id, 
            $expr: { $eq: [ '$requester', '$$recipient' ] }
          }},
        ],
        as: 'friend'
      }},
      { $lookup: {
        from: User.collection.name,
        localField: 'recipient',
        foreignField: '_id',
        as: 'user'
      }},
      { $match: { 'requester': user._id } },
      { $sort: { updatedAt: -1 } },
      { $project: {
        status: 1,
        content: 1,
        remark: 1,
        shareHelp: 1,
        shareShare: 1,
        recipient_status: { '$ifNull': [ { "$min": "$friend.status" }, 0 ] },
        recipient_id: '$user._id',
        recipient_name: '$user.nickname',
      }}
    ]
  )

  // 更新访问时间
  if (query.isVisit) {
    let now = new Date()
    await FeatureVisitor.updateOne({
      visitor_id: user._id,
      feature: 'friend'
    }, 
    { $set: { 
      visited_date: now
    }},     
    {
      runValidators: true, 
      upsert: true
    })
  }

  // 返回数据
  ctx.body = {
    success: true,
    friends,
  }
})

// 获取指定用户公开信息
router.get('/profile/:id', async (ctx, next) => {
  const { id } = ctx.params
  const profile = await User.findById(id)
    .select('_id nickname')

  ctx.body = {
    success: true,
    profile,
  }
})

// 查找用户
router.get('/user/search', async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_HOME_PAGE,
      constant.APP_NAME, 
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

  let phone = query.phone && query.phone.trim() || ''

  // 来源页错误信息
  let info = ctx.session.info

  // 结果总数
  let total = await User.countDocuments({ phone })
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
      { '$match': { phone }},
      { '$project': {
        '_id': 1,
        'nickname': 1,
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
    noUserResult: constant.NO_USER_RESULT,
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
})

// 心
router.get(['/mind', '/party/:id'], async (ctx, next) => {
  let { user } = ctx.state
  , uid = user && user._id
  , quoteQuery = Mind.quoteQuery(uid)
  , nickname = user && user.nickname

  // 标题和其他配置信息
  ctx.state = Object.assign(ctx.state, { 
    title: [ nickname, constant.APP_NAME, ].join('——'),
    description: constant.APP_SLOGAN,
    keywords: constant.SITE_KEWWORDS
  })

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index
  let condition = {
    type_id: 'share'
  }

  // 分类
  let keywords = query.keywords && query.keywords.trim() || ''

  // 关键词和内容类别
  if (keywords) {
    condition.keywords = keywords

    // 更新关键词访问次数
    /* await Keyword.findOneAndUpdate({ 
      name: keywords
    }, { 
      $inc: { visits: 1 } 
    }, {
      runValidators: true, 
      new: true,
      upsert: true
    }) */
  }

  let party_id = ctx.params.id
  , party = null
  , currentPage = ''
  if (!party_id) {
    if (uid) {
      // 获取公号名
      let partys = await Party.find({ creator_id: uid }, '_id name')
      party = partys[0] || null
      party_id = party && party._id
      currentPage = 'mind'
      condition.creator_id = uid
      // 获取烦恼
      let { tab } = query
      if (tab && tab === 'trouble') { 
        condition.type_id = 'help'
      } else {
        party_id && (condition.party_id = mongoose.Types.ObjectId(party_id))
      }
    }
  } else {
    // 获取公号名
    let partys = await Party.find({ _id: party_id }, '_id name')
    party = partys[0] || null
    currentPage = 'party'
    party_id && (condition.party_id = mongoose.Types.ObjectId(party_id))
  }

  let keywordList = []
  , { tab } = query
  , isTrouble = tab && tab === 'trouble' && uid
  if (isTrouble || party_id) {
    // 查询类别
    let opts = [
      { $lookup: {
        from: Mind.collection.name,
        let: { 'mind_id': '$mind_id' },
        pipeline: [
          { $match: { 
            $expr: {
              $eq: [ '$_id', '$$mind_id' ] 
            }
          }},
          { $project: {
            type_id: 1,
            party_id: 1
          }}
        ],
        as: 'mind'
      }}, 
      { $unwind: '$mind' }, 
      { 
        $group: { 
          _id: '$name', 
          visits: { $sum: '$visits' },
          total: { $sum: 1 }, 
          createdAt: { $last: '$createdAt' }
        } 
      },
      { $project: { 
        _id: 1,
        total: 1,
        visits: 1,
        createdAt: 1,
        order: { 
          $cond : [ { $eq : ['$_id', keywords] }, 1 , 0 ]
        },
      }},
      // 哪个更重要，怎么比重
      { $sort: { order: -1, createdAt: -1, total: -1, visits: -1 } },
    ]
    if (isTrouble) {
      // 获取烦恼
      if (tab && tab === 'trouble') {
        opts.splice(2, 0, { $match: {
          $expr: {
            $and: [{
              $eq: [ '$mind.type_id', 'help' ]
            }, {
              $eq: [ '$creator_id',  uid]
            }]
          }
        }})
      }
    } else {
      opts.splice(2, 0, { $match: {
        $expr: {
          $and: [{
            $eq: ['$mind.party_id', party_id]
          }, {
            $eq: [ '$creator_id',  uid]
          }]
        }
      }})
    }
    keywordList = await Keyword.aggregate(opts)
  }

  // 心念总数
  let total = await Mind.countDocuments(condition)
  let totalPage = Math.ceil(total / limit)
  let pageInfo = null
  const nextPage = page < totalPage ? page + 1 : 0
  if (ctx.isXhr) {
    pageInfo = {
      nextPage
    }
  } else {
    pageInfo = {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage
    }
  }

  // 查找所有记录
  // let friendshipQuery = Friend.friendshipQuery(uid)
  let config = [
    { $match: condition },
    // Visitor.queryVisitor(uid),
    // 查找最新回复
    /* { $lookup: {
      from: Reply.collection.name,
      let: { 'mind_id': '$_id' },
      pipeline: [
        ...friendshipQuery,
        Friend.replyfriendshipMatch(uid),
        { $project: {
          created_date: 1
        }},
        { $sort: { created_date: -1 } },
        { $limit: 1 }
      ],
      as: 'last_reply'
    }},
    { $lookup: {
      from: Reply.collection.name,
      let: { 'mind_id': '$_id' },
      pipeline: [
        // 心事回复匹配是否为知己关系
        ...Friend.friendshipQuery(uid),
        Friend.newReplyfriendshipMatch(uid),
        // 查询回复创建者信息
        User.authorInfoQuery(),
        Friend.requesterQuery(uid),
        // 获取引用
        ...quoteQuery,
        { $project: {
          creator_id: 1,
          content: 1,
          created_date: 1,
          author: { $cond : [ { $eq : ['$author', []]}, [ null ], '$author'] },
          friend: { $cond : [ { $eq : ['$friend', []]}, [ null ], '$friend'] },
          sub_type: 1
        }},
        { $sort: { created_date: -1 } },
        { $limit: 1 },
        { $unwind: '$author' },
        { $unwind: '$friend' },
        { $project: {
          creator_id: 1,
          content: 1,
          created_date: 1,
          author: 1,
          friend: 1,
          sub_type: 1
        }},
      ],
      as: 'new_reply'
    }}, */
    // 获取引用
    ...quoteQuery,
    { $project: {
      _id: 1, 
      type_id: 1, 
      column_id: 1, 
      title: 1, 
      is_extract: 1, 
      summary: 1, 
      perm_id: 1,
      creator_id: 1,
      created_date: 1,
      updated_date: 1,
      //visitor: { $cond : [ { $eq : ['$visitor', []]}, [ null ], '$visitor'] },
      quote_mind: { $cond : [ { $eq : ['$quote_mind', []]}, [ null ], '$quote_mind'] },
      quote_classic: { $cond : [ { $eq : ['$quote_classic', []]}, [ null ], '$quote_classic'] },
      //new_reply: { $cond : [ { $eq : ['$new_reply', []]}, [ null ], '$new_reply'] },
      //last_reply: { $cond : [ { $eq : ['$last_reply', []]}, [ null ], '$last_reply'] },
      state_change_date: 1
    }},
    //{ $unwind: '$visitor' },
    //{ $unwind: '$new_reply' },
    //{ $unwind: '$last_reply' },
    { $unwind: '$quote_mind' },
    { $unwind: '$quote_classic' },
    { $project: {
      _id: 1, 
      type_id: 1, 
      column_id: 1, 
      title: 1, 
      is_extract: 1, 
      summary: 1, 
      perm_id: 1,
      creator_id: 1,
      created_date: 1,
      updated_date: 1,
      has_new: 1,
      quote: { $ifNull: [ '$quote_mind', '$quote_classic' ] },
      //new_reply: 1,
      //last_reply: 1,
      //reply_visit_date: { $cond : [ { $ne : ['$visitor', null]}, '$visitor.visited_date', '$created_date'] },
      ///new_reply_date: { $cond : [ { $ne : ['$new_reply', null]}, '$new_reply.created_date', '$created_date'] },
      //state_change_date: { $cond : [ { $ne : ['$last_reply', null]}, '$last_reply.created_date', '$state_change_date'] },
      state_change_date: 1
    }},
    { $sort: { state_change_date: -1 } },
    { $skip: skip },
    { $limit: limit }
  ]
  let minds = await Mind.aggregate(config)

  await ctx.fullRender('diary', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    partyname: party && party.name,
    features: constant.FEATURES,
    noDataTips: constant.NO_MIND,
    currKeyword: keywords || '',
    keywordList,
    currentPage,
    pageInfo,
    minds
  })
})

// 尘
router.get(['/', '/earth'], async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: constant.APP_NAME,
    description: constant.APP_SLOGAN,
    keywords: constant.SITE_KEWWORDS
  })

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 分类
  let tag = query.tag
  , keywords = query.keywords && query.keywords.trim() || ''
  , matchCon = {
    type_id: { $in: ['share', 'help'] }
  }

  if (tag) {
    if (tag === 'feeling') {
      matchCon.type_id = 'share'
    } else if (tag === 'trouble') {
      matchCon.type_id = 'help'
    } else if (tag === 'sentence') {
      matchCon.$or = [
        {
          $and: [
            { column_id: tag },
            { ref_id: null }
          ],
        }, {
          $and: [
            { ref_column: tag },
            { ref_id: { '$ne': null } }
          ],
        }
      ]
    } else {
      matchCon.$or = [
        { column_id: tag },
        { ref_column: tag }
      ]
    }
  }

  // 关键词和内容类别
  if (keywords) {
    matchCon.keywords = keywords

    // 更新关键词访问次数
    /* await Keyword.findOneAndUpdate({ 
      name: keywords
    }, { 
      $inc: { visits: 1 } 
    }, {
      runValidators: true, 
      new: true,
      upsert: true
    }) */
  }

  // 查询类别
  let opts = [
    { 
      $group: { 
        _id: '$name', 
        visits: { $sum: '$visits' },
        total: { $sum: 1 }, 
        createdAt: { $last: '$createdAt' }
      } 
    },
    { $project: { 
      _id: 1,
      total: 1,
      visits: 1,
      createdAt: 1,
      order: { 
        $cond : [ { $eq : ['$_id', keywords] }, 1 , 0 ]
      },
    }},
    // 哪个更重要，怎么比重
    { $sort: { order: -1, createdAt: -1, total: -1, visits: -1 } },
  ]
  if (tag) {
    if (tag === 'feeling') {
      opts.unshift({ $match: {
        $expr: {
          $eq: [ '$mind.type_id', 'share' ]
        }
      }})
    } else if (tag === 'trouble') {
      opts.unshift({ $match: {
        $expr: {
          $eq: [ '$mind.type_id', 'help' ]
        }
      }})
    } else {
      opts.unshift({ $match: {
        $expr: {
          $or: [
            { $eq: [ '$mind.column_id', tag ] },
            { $eq: [ '$mind.ref_column', tag ] },
          ]
        }
      }})
    }
    opts.unshift({ $lookup: {
      from: Mind.collection.name,
      let: { 'mind_id': '$mind_id' },
      pipeline: [
        { $match: { 
          $expr: {
            $eq: [ '$_id', '$$mind_id' ] 
          }
        }},
        { $project: {
          column_id: 1,
          ref_column: 1,
          type_id: 1
        }}
      ],
      as: 'mind'
    }}, { $unwind: '$mind' })
  }
  const keywordList = await Keyword.aggregate(opts)

  // 心念总数
  let total = await Mind.countDocuments(matchCon)
  let totalPage = Math.ceil(total / limit)
  let pageInfo = null

  const { user } = ctx.state
  , uid = user && user._id
  // 查找所有记录
  let condition = []
  , match = { $match: matchCon }
  , project = {
    _id: 1, 
    type_id: 1, 
    column_id: 1, 
    party: { $cond : [ { $eq : ['$party', []]}, [ null ], '$party'] },
    title: 1, 
    poster: 1,
    ref_type: 1,
    content: 1, 
    is_extract: 1, 
    summary: 1, 
    keywords: 1,
    perm_id: 1,
    behalf: 1,
    created_date: 1, 
    state_change_date: 1,
    creator_id: 1
  }
  , initProject = { 
    $project: Object.assign({}, project, {
      quote_mind: { $cond : [ { $eq : ['$quote_mind', []]}, [ null ], '$quote_mind'] },
      quote_classic: { $cond : [ { $eq : ['$quote_classic', []]}, [ null ], '$quote_classic'] },
    })
  }

  if (uid) {
    condition = [
      match,
      // 获取公号信息
      Party.partyInfoQuery(),
      // 获取引用
      ...Mind.quoteQuery(uid),
      initProject,
      { $unwind: '$party'},
      { $unwind: '$quote_mind'},
      { $unwind: '$quote_classic'},
      {
        $project: Object.assign({}, project, {
          party: 1,
          quote: { $ifNull: [ '$quote_mind', '$quote_classic' ] },
        })
      },
      { '$sort': { 'state_change_date': -1} },
      { '$skip' : skip },
      { "$limit": limit }
    ]
  }
  else {
    condition = [
      match,
      // 获取公号
      Party.partyInfoQuery(),
      // 获取引用
      ...Mind.quoteQuery(uid),
      initProject, 
      { $unwind: '$party'},
      { $unwind: '$quote_mind'},
      { $unwind: '$quote_classic'},
      {
        $project: Object.assign({}, project, {
          party: 1,
          quote: { $ifNull: [ '$quote_mind', '$quote_classic' ] },
        })
      },
      { '$sort': { 'state_change_date': -1} },
      { '$skip' : skip },
      { "$limit": limit }
    ]
  }

  let minds = await Mind.aggregate(
    condition
  )

  if (uid) {
    // 受益状态
    let mindIds = minds.map(mind => mind._id)
    const thankQueryCondition = {
      type: 'emotion',
      parent_id: { $in: mindIds },
      creator_id: uid,
      receiver_id: { $ne: uid }
    }
    let thanks = await Reply.find(thankQueryCondition, 'parent_id').lean()
    minds = minds.map(mind => {
      mind.isThanked = thanks.findIndex(
        thank => thank.parent_id.equals(mind._id)) > -1
      return mind
    })
  }

  // 返回并渲染首页
  const nextPage = page < totalPage ? page + 1 : 0
  if (ctx.isXhr) {
    pageInfo = {
      nextPage
    }
  } else {
    pageInfo = {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage
    }
  }
  await ctx.fullRender('classics', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    noDataTips: constant.NO_CLASSICS,
    currTag: tag || '',
    currKeyword: keywords || '',
    pageInfo,
    keywordList,
    minds
  })
})

// 投缘
router.get('/karma/fate', async (ctx, next) => {
  let { user } = ctx.state
  , uid = user && user._id

  // 分页
  let { query } = ctx.request
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit

  let fateMatch = {
    $match: { 
      $expr: {
        $and: [
          {
            $or: [
              { 
                $and: [
                  { $eq: [ '$creator_id', uid ] },
                  { $ne: [ '$receiver_id', uid ] },
                ] 
              }, 
              { 
                $and: [
                  { $eq: [ '$receiver_id', uid ] },
                  { $ne: [ '$creator_id', uid ] },
                ] 
              }
            ]
          }
        ]
      }
    }
  }

  let friendshipQuery =   Friend.friendshipQuery(user._id, '_id')
  , neReqfriendMatch = Friend.neReqfriendMatch()

  // 投缘总数
  let totalQueryResult = await Reply.aggregate(
    [
      fateMatch,
      {
        $project: {
          user_id: {
            $cond: {
              if: { '$eq': [ '$receiver_id', user._id ] },
              then: '$creator_id',
              else: '$receiver_id'
            }
          },
      } },
      { $group: { _id: '$user_id', total: { $sum: 1 } } },
      ...friendshipQuery,
      neReqfriendMatch,
      { $project: { _id: 0 } }
    ]
  )
  let total = totalQueryResult 
    && totalQueryResult[0] 
    && totalQueryResult[0].total 
    || 0

  let totalPage = Math.ceil(total / limit)
  let pageInfo = {
    nextPage: page < totalPage ? page + 1 : 0
  }

  // 查找所有记录
  let diarys = await Reply.aggregate(
    [
      fateMatch,
      {
        $project: {
          creator_id: 1,
          receiver_id: 1,
          user_id: {
            $cond: {
              if: { '$eq': [ '$receiver_id', user._id ] },
              then: '$creator_id',
              else: '$receiver_id'
            }
          },
          sub_type: 1,
          created_date: 1,
          oTexts: {
            $cond: {
              if: { '$eq': [ '$creator_id', user._id ] },
              then: {            
                $cond: {
                  if: { $eq: ['$sub_type', 'text'] },
                  then: 1,
                  else: 0
                }
              },
              else: 0
            }
          },
          oThanks: {
            $cond: {
              if: { '$eq': [ '$creator_id', user._id ] },
              then: {            
                $cond: {
                  if: { $eq: ['$sub_type', 'thank'] },
                  then: 1,
                  else: 0
                }
              },
              else: 0
            }
          },
          oUnderstands: {
            $cond: {
              if: { $eq: [ '$creator_id', user._id ] },
              then: {            
                $cond: {
                  if: { $eq: ['$sub_type', 'understand'] },
                  then: 1,
                  else: 0
                }
              },
              else: 0
            }
          },
          mTexts: {
            $cond: {
              if: { '$eq': [ '$receiver_id', user._id ] },
              then: {            
                $cond: {
                  if: { $eq: ['$sub_type', 'text'] },
                  then: 1,
                  else: 0
                }
              },
              else: 0
            }
          },
          mThanks: {
            $cond: {
              if: { '$eq': [ '$receiver_id', user._id ] },
              then: {            
                $cond: {
                  if: { $eq: ['$sub_type', 'thank'] },
                  then: 1,
                  else: 0
                }
              },
              else: 0
            }
          },
          mUnderstands: {
            $cond: {
              if: { '$eq': [ '$receiver_id', user._id ] },
              then: {            
                $cond: {
                  if: { $eq: ['$sub_type', 'understand'] },
                  then: 1,
                  else: 0
                }
              },
              else: 0
            }
          },
        }
      },
      { $sort: { 'created_date': -1 } },
      {
        $group : {
          _id : '$user_id',
          mTextTotal: { $sum: '$mTexts' },
          mThankTotal: { $sum: '$mThanks' },
          mUnderstandTotal: { $sum: '$mUnderstands' },
          oTextTotal: { $sum: '$oTexts' },
          oThankTotal: { $sum: '$oThanks' },
          oUnderstandTotal: { $sum: '$oUnderstands' },
          creator_id: { $first: '$creator_id' },
          sub_type: { $first: '$sub_type' },
          created_date: { $first: '$created_date' }
        }
      },
      ...friendshipQuery,
      neReqfriendMatch,
      { $skip: skip },
      { $limit: limit },
      { $lookup: {
        from: User.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'giver'
      }},
      { $unwind: '$giver' },
      {
        $project: {
          _id: 1,
          creator_id: 1,
          nickname: '$giver.nickname',
          oTextTotal: 1,
          oThankTotal: 1,
          oUnderstandTotal: 1,
          mTextTotal: 1,
          mThankTotal: 1,
          sub_type: 1,
          mUnderstandTotal: 1,
          created_date: 1
        }
      }
    ]
  )

  // 更新访问时间
  if (query.isVisit) {
    let now = new Date()
    await FeatureVisitor.updateOne({
      visitor_id: user._id,
      feature: 'fate'
    }, 
    { $set: { 
      visited_date: now
    }},     
    {
      runValidators: true, 
      upsert: true
    })
  }

  // 返回并渲染首页
  ctx.body = {
    success: true,
    pageInfo,
    diarys
  }
})

// 谈心
router.get('/karma/talk', async (ctx, next) => {
  let { user } = ctx.state
  , uid = user && user._id

  // 知己关系
  let friendshipQuery = Friend.friendshipQuery(uid)
  let friendshipMatch = Friend.friendshipMatch()
  let requesterQuery = Friend.requesterQuery(uid)
  let authorInfoQuery = User.authorInfoQuery()
  let quoteQuery = Mind.quoteQuery(uid)

  // 分页
  let { query } = ctx.request
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit

  // 知己心事数目
  let totalQueryResult = await Mind.aggregate([
    ...friendshipQuery,
    { $unwind: '$recipient'},
    { $unwind: '$requester'},
    friendshipMatch,
    { $count: 'total' }
  ])
  let total = totalQueryResult 
    && totalQueryResult[0] 
    && totalQueryResult[0].total 
    || 0
  let totalPage = Math.ceil(total / limit)
  let nextPage = page < totalPage ? page + 1 : 0
  let pageInfo = { nextPage }

  // 查找知己的心事
  let helps = await Mind.aggregate([
    ...friendshipQuery,
    { $unwind: '$recipient'},
    { $unwind: '$requester'},
    friendshipMatch,
    Visitor.queryVisitor(uid),
    // 查询心念创建者信息
    authorInfoQuery,
    requesterQuery,
    // 获取引用
    ...quoteQuery,
    // 查找最新回复
    { $lookup: {
      from: Reply.collection.name,
      let: { 'mind_id': '$_id' },
      pipeline: [
        ...friendshipQuery,
        Friend.replyfriendshipMatch(uid),
        { $project: {
          created_date: 1
        }},
        { $sort: { created_date: -1 } },
        { $limit: 1 }
      ],
      as: 'last_reply'
    }},
    // 查询回复我的
    { $lookup: {
      from: Reply.collection.name,
      let: { 'mind_id': '$_id' },
      pipeline: [
        // 心事回复匹配是否为知己关系
        ...friendshipQuery,
        Friend.newReplyfriendshipMatch(uid),
        // 查询回复创建者信息
        authorInfoQuery,
        requesterQuery,
        // 获取引用
        ...quoteQuery,
        { $project: {
          creator_id: 1,
          content: 1,
          created_date: 1,
          author: { $cond : [ { $eq : ['$author', []]}, [ null ], '$author'] },
          friend: { $cond : [ { $eq : ['$friend', []]}, [ null ], '$friend'] },
          sub_type: 1
        }},
        { $sort: { created_date: -1 } },
        { $limit: 1 },
        { $unwind: '$author' },
        { $unwind: '$friend' },
        { $project: {
          creator_id: 1,
          content: 1,
          created_date: 1,
          author: 1,
          friend: 1,
          sub_type: 1
        }},
      ],
      as: 'new_reply'
    }},
    { $project: {
      _id: 1, 
      type_id: 1, 
      column_id: 1, 
      title: 1, 
      perm_id: 1,
      author: { $cond : [ { $eq : ['$author', []]}, [ null ], '$author'] },
      friend: { $cond : [ { $eq : ['$friend', []]}, [ null ], '$friend'] },
      is_extract: 1, 
      summary: 1, 
      creator_id: 1,
      created_date: 1,
      updated_date: 1,
      visitor: { $cond : [ { $eq : ['$visitor', []]}, [ null ], '$visitor'] },
      quote_mind: { $cond : [ { $eq : ['$quote_mind', []]}, [ null ], '$quote_mind'] },
      quote_classic: { $cond : [ { $eq : ['$quote_classic', []]}, [ null ], '$quote_classic'] },
      new_reply: { $cond : [ { $eq : ['$new_reply', []]}, [ null ], '$new_reply'] },
      last_reply: { $cond : [ { $eq : ['$last_reply', []]}, [ null ], '$last_reply'] },
      state_change_date: 1
    }},
    { $unwind: '$author' },
    { $unwind: '$friend' },
    { $unwind: '$visitor' },
    { $unwind: '$new_reply' },
    { $unwind: '$last_reply' },
    { $unwind: '$quote_mind' },
    { $unwind: '$quote_classic' },
    { $project: {
      _id: 1, 
      type_id: 1, 
      column_id: 1, 
      title: 1, 
      perm_id: 1,
      author: 1,
      friend: 1,
      is_extract: 1, 
      summary: 1, 
      creator_id: 1,
      created_date: 1,
      updated_date: 1,
      has_new: 1,
      quote: { $ifNull: [ '$quote_mind', '$quote_classic' ] },
      new_reply: 1,
      last_reply: 1,
      reply_visit_date: { $cond : [ { $ne : ['$visitor', null]}, '$visitor.visited_date', '$created_date'] },
      new_reply_date: { $cond : [ { $ne : ['$new_reply', null]}, '$new_reply.created_date', '$created_date'] },
      state_change_date: { $cond : [ { $ne : ['$last_reply', null]}, '$last_reply.created_date', '$state_change_date'] },
    }},
    { $sort: { state_change_date: -1 } },
    { $skip: skip },
    { $limit: limit }
  ])

  if (uid) {
    // 受益状态
    let mindIds = helps.map(mind => mind._id)
    const thankQueryCondition = {
      type: 'emotion',
      parent_id: { $in: mindIds },
      creator_id: uid,
      receiver_id: { $ne: uid }
    }
    let thanks = await Reply.find(thankQueryCondition, 'parent_id').lean()
    helps = helps.map(mind => {
      mind.isThanked = thanks.findIndex(
        thank => thank.parent_id.equals(mind._id)) > -1
      return mind
    })
  }

  // 没有内容时查询是否有知己
  let friendTotal = 1
  if (!helps || !helps.length) {
    friendTotal = await Friend.getFriendTotal(user._id)
  }

  // 更新访问时间
  if (query.isVisit) {
    let now = new Date()
    await FeatureVisitor.updateOne  ({
      visitor_id: user._id,
      feature: 'talk',
    }, 
    { $set: { 
      visited_date: now
    }},     
    {
      runValidators: true, 
      upsert: true,
      new: true
    })
  }

  ctx.body = {
    success: true,
    friendTotal,
    pageInfo,
    helps,
  }
})

// 缘心念展示
// TODO 需要判断当前心事是否已经有了回复
router.get('/help/:id', async (ctx, next) => {
  let { user } = ctx.state
  , uid = user && user._id

  // 分页
  let { query } = ctx.request
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit

  // 知己回复数目
  let mindId = mongoose.Types.ObjectId(ctx.params.id)
  , friendshipQuery = Friend.friendshipQuery(uid)
  , totalQueryResult = await Reply.aggregate([
    ...friendshipQuery,
    { $project: {
      parent_id: 1,
      creator_id: 1,
      recipient: { $cond : [ { $eq : ['$recipient', []]}, [ null ], '$recipient'] },
      requester: { $cond : [ { $eq : ['$requester', []]}, [ null ], '$requester'] }
    } },
    { $unwind: '$recipient'},
    { $unwind: '$requester'},
    Friend.replyfriendshipMatch(uid, mindId),
    { $count: 'total' }
  ])
  let total = totalQueryResult 
    && totalQueryResult[0] 
    && totalQueryResult[0].total 
    || 0
  let totalPage = Math.ceil(total / limit)
  let nextPage = page < totalPage ? page + 1 : 0
  let pageInfo = { nextPage }
  
  let authorInfoQuery = User.authorInfoQuery()
  , requesterQuery = Friend.requesterQuery(uid)
  , quoteQuery = Mind.quoteQuery(uid)
  , helps = await Mind.aggregate(
    [
      { $match: { _id: mindId } },
      // 查询心念创建者信息
      authorInfoQuery,
      requesterQuery,
      // 获取引用
      ...quoteQuery,
      {
        $lookup: {
          from: Reply.collection.name,
          let: { mind_id: '$_id' },
          pipeline: [
            { $match: {
              $expr: { 
                $and: [
                  { $eq: [ '$type', 'emotion' ] },
                  { $eq: [ '$parent_id', '$$mind_id' ] },
                  { $eq: [ '$creator_id', uid ] },
                  { $ne: [ '$receiver_id', uid ] },
                ]
              }
            } }
          ],
          as: 'thank'
        }
      },
      { $lookup: {
        from: Reply.collection.name,
        let: { 'mind_id': '$_id' },
        pipeline: [
          ...friendshipQuery,
          authorInfoQuery,
          requesterQuery,
          User.receiverInfoQuery(),
          Friend.receiverRequesterQuery(uid),
          // 获取引用
          ...quoteQuery,
          { $project: {
            _id: 1,
            content: 1,
            type: 1,
            sub_type: 1,
            reply_type: 1,
            parent_id: 1,
            creator_id: 1,
            created_date: 1,
            recipient: { $cond : [ { $eq : ['$recipient', []]}, [ null ], '$recipient'] },
            requester: { $cond : [ { $eq : ['$requester', []]}, [ null ], '$requester'] },
            author: { $cond : [ { $eq : ['$author', []]}, [ null ], '$author'] },
            friend: { $cond : [ { $eq : ['$friend', []]}, [ null ], '$friend'] },
            receiver: { $cond : [ { $eq : ['$receiver', []]}, [ null ], '$receiver'] },
            friend_receiver: { $cond : [ { $eq : ['$friend_receiver', []]}, [ null ], '$friend_receiver'] },
            quote_mind: { $cond : [ { $eq : ['$quote_mind', []]}, [ null ], '$quote_mind'] },
            quote_classic: { $cond : [ { $eq : ['$quote_classic', []]}, [ null ], '$quote_classic'] },
          }},
          { $sort: { created_date: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $unwind: '$author' },
          { $unwind: '$friend' },
          { $unwind: '$receiver' },
          { $unwind: '$friend_receiver' },
          { $unwind: '$quote_mind' },
          { $unwind: '$quote_classic' },
          { $unwind: '$recipient'},
          { $unwind: '$requester'},
          Friend.replyfriendshipMatch(uid),
          { $project: {
            _id: 1,
            content: 1,
            type: 1,
            sub_type: 1,
            reply_type: 1,
            creator_id: 1,
            created_date: 1,
            author: 1,
            friend: 1,
            receiver: 1,
            friend_receiver: 1,
            quote: { $ifNull: [ '$quote_mind', '$quote_classic' ] },
          }},
        ],
        as: 'replies'
      }},
      { $project: {
        _id: 1,
        type_id: 1,
        title: 1,
        summary: 1,
        content: 1,
        creator_id: 1,
        perm_id: 1,
        behalf: 1,
        last_reply_date: 1,
        created_date: 1,
        replies: '$replies',
        author: { $cond : [ { $eq : ['$author', []]}, [ null ], '$author'] },
        friend: { $cond : [ { $eq : ['$friend', []]}, [ null ], '$friend'] },
        quote_mind: { $cond : [ { $eq : ['$quote_mind', []]}, [ null ], '$quote_mind'] },
        quote_classic: { $cond : [ { $eq : ['$quote_classic', []]}, [ null ], '$quote_classic'] },
        isThanked: { $cond : [ { $eq : ['$thank', []]}, false, true] },
      }},
      { $unwind: '$author' },
      { $unwind: '$friend' },
      { $unwind: '$quote_mind' },
      { $unwind: '$quote_classic' },
      { $project: {
        _id: 1,
        type_id: 1,
        title: 1,
        summary: 1,
        content: 1,
        creator_id: 1,
        perm_id: 1,
        behalf: 1,
        last_reply_date: 1,
        created_date: 1,
        replies: 1,
        author: 1,
        friend: 1,
        isThanked: 1,
        quote: { $ifNull: [ '$quote_mind', '$quote_classic' ] },
      }}
    ]
  )
  
  let help = helps && helps.length && helps[0]

  // 更新访问时间
  let now = new Date()
  await Visitor.updateOne({
    visitor_id: user._id,
    basis_id: help._id,
  }, 
  { $set: { 
    visited_date: now
  }},     
  {
    runValidators: true, 
    upsert: true
  })

  ctx.body = {
    success: true,
    noDataTips: constant.NO_MINE_TROUBLE,
    pageInfo,
    help
  }
})

// 获得推荐时的忧扰
router.get('/recommend/helps', async (ctx, next) => {
  let { user } = ctx.state
  let friendshipQuery = Friend.friendshipQuery(user._id)
  let friendshipMatch = Friend.friendshipMatch()

  // 分页
  let { query } = ctx.request
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit

  // 我的烦恼总数
  let totalQueryResult = await Mind.aggregate([
    ...friendshipQuery,
    { $unwind: '$recipient'},
    { $unwind: '$requester'},
    friendshipMatch,
    { $count: 'total' }
  ])
  let total = totalQueryResult 
    && totalQueryResult[0] 
    && totalQueryResult[0].total 
    || 0
  let totalPage = Math.ceil(total / limit)
  let nextPage = page < totalPage ? page + 1 : 0
  let pageInfo = { nextPage }

  // 查找知己的心事
  let helps = await Mind.aggregate(
    [
      ...friendshipQuery,
      { $unwind: '$recipient'},
      { $unwind: '$requester'},
      friendshipMatch,
      // 查询心念创建者信息
      User.authorInfoQuery(),
      Friend.requesterQuery(user._id),
      { $project: {
        _id: 1,
        title: 1,
        author: { $cond : [ { $eq : ['$author', []]}, [ null ], '$author'] },
        friend: { $cond : [ { $eq : ['$friend', []]}, [ null ], '$friend'] },
        summary: 1,
        creator_id: 1,
        state_change_date: 1
      }},
      { $unwind: '$author' },
      { $unwind: '$friend' },
      { $project: {
        _id: 1,
        title: 1,
        author: 1,
        friend: 1,
        summary: 1,
        creator_id: 1,
        state_change_date: 1
      }},
      { $sort: { state_change_date: -1 } },
      { $skip : skip },
      { $limit: limit }
    ]
  )

  // 没有内容时查询是否有知己
  let friendTotal = 1
  if (!helps || !helps.length) {
    // friendTotal = await Friend.getFriendTotal(user._id)
  }
  
  ctx.body = {
    success: true,
    noDataTips: constant.NO_TROUBLE,
    friendTotal,
    pageInfo,
    helps
  }
})

// 感悟创建页
router.get('/mind/create', async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [
      '分享感悟',
      constant.APP_NAME, 
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 返回并渲染首页
  await ctx.fullRender('classicmodify', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    shareHolder: constant.SHARE_HOLDER,
    features: constant.FEATURES,
    columns: constant.COLUMNS,
    backPage: '/',
    mind: null,
    info
  })

  ctx.session.info = null
})

// 尘心念展示
router.get('/mind/:id', async (ctx, next) => {
  let mindId = ctx.params.id
  //, { user } = ctx.state
  //, uid = user && user._id
  // 分页
  , { query } = ctx.request
  , page = +query.page || 1
  , limit = +query.limit || constant.LIST_LIMIT
  , skip = (page - 1) * limit
  , _mindId = mongoose.Types.ObjectId(mindId)
  , total = Reply.countDocuments({
    parent_id: _mindId
  })
  , totalPage = Math.ceil(total / limit)
  , nextPage = page < totalPage ? page + 1 : 0
  , pageInfo = { nextPage }
  //, quoteQuery = Mind.quoteQuery(uid)
  , minds = await Mind.aggregate(
    [
      { $match: { _id: _mindId } },
      //...Mind.quoteQuery(uid),
      { $lookup: {
        from: Reply.collection.name,
        let: { 'mind_id': '$_id' },
        pipeline: [
          { $match: { parent_id: _mindId } },
          // 获取公号信息
          Party.partyInfoQuery(),
          // 获取引用
          //...quoteQuery,
          { $project: {
            _id: 1,
            title: 1,
            summary: 1,
            type: 1,
            sub_type: 1,
            reply_type: 1,
            parent_id: 1,
            creator_id: 1,
            party: { $cond : [ { $eq : ['$party', []]}, [ null ], '$party'] },
            //quote_mind: { $cond : [ { $eq : ['$quote_mind', []]}, [ null ], '$quote_mind'] },
            //quote_classic: { $cond : [ { $eq : ['$quote_classic', []]}, [ null ], '$quote_classic'] },
          }},
          { $sort: { created_date: -1 } },
          { $skip: skip },
          // { $limit: limit },
          { $unwind: '$party'},
          //{ $unwind: '$quote_mind' },
          //{ $unwind: '$quote_classic' },
          { $project: {
            _id: 1,
            title: 1,
            summary: 1,
            type: 1,
            sub_type: 1,
            reply_type: 1,
            creator_id: 1,
            created_date: 1,
            party: 1,
            //quote: { $ifNull: [ '$quote_mind', '$quote_classic' ] },
          }},
        ],
        as: 'replies'
      }},
      { $project: {
        _id: 1,
        type_id: 1,
        column_id: 1,
        title: 1,
        summary: 1, 
        content: 1,
        //quote_mind: { $cond : [ { $eq : ['$quote_mind', []]}, [ null ], '$quote_mind'] },
        //quote_classic: { $cond : [ { $eq : ['$quote_classic', []]}, [ null ], '$quote_classic'] },
        perm_id: 1,
        behalf: 1,
        creator_id: 1,
        replies: '$replies',
        state_change_date: 1
      } },
      //{ $unwind: '$quote_mind' },
      //{ $unwind: '$quote_classic' },
      { $project: {
        _id: 1,
        type_id: 1,
        column_id: 1,
        title: 1,
        summary: 1, 
        content: 1,
        //quote: { $ifNull: [ '$quote_mind', '$quote_classic' ] },
        perm_id: 1,
        behalf: 1,
        creator_id: 1,
        replies: 1,
        state_change_date: 1
      } }
    ]
  )
    
  let mind = minds && minds[0]
  //, ua = ctx.request.headers['user-agent'].toLowerCase()
  , is_wechat = false// ua.indexOf("micromessenger") > 0
  ctx.state = Object.assign(ctx.state, {
    title: [
      mind.title || mind.summary,
      constant.APP_NAME, 
    ].join('——'),
    // need_auto_script: false,
    need_dom4_script: false,
    // need_global_script: false
    is_wechat,
    description: mind.summary
  })

  let resData = {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    pageInfo,
    mind
  }
  if (!ctx.state.isXhr && is_wechat) {
    //获取当前url
    let { protocol, host, originalUrl } = ctx.request
    , url = protocol + '://' + host + originalUrl
    resData.signatureMap = await signature.sign(url)
  }

  // 返回并渲染首页
  await ctx.fullRender('mind', resData)
})

// 感悟编辑页
router.get('/mind/:id/modify', async (ctx, next) => {
  const mindId = ctx.params.id
  ctx.state = Object.assign(ctx.state, { 
    title: [
      '编辑感悟',
      constant.APP_NAME, 
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 查找所有烦恼
  let mind = await Mind.findById(mindId)
    .select('_id title content keywords column_id')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('classicmodify', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    shareHolder: constant.SHARE_HOLDER,
    features: constant.FEATURES,
    columns: constant.COLUMNS,
    mind,
    backPage: '/mind',
    info
  })

  ctx.session.info = null
})

// 引经据典创建页
router.get('/classic/create', async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [
      '推荐作品',
      constant.APP_NAME, 
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 返回并渲染首页
  await ctx.fullRender('classicmodify', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    shareHolder: constant.SHARE_HOLDER,
    features: constant.FEATURES,
    columns: constant.COLUMNS,
    backPage: '/',
    classic: null,
    info
  })

  ctx.session.info = null
})

// 添加章节
router.get('/classic/:id/section/create', async (ctx, next) => {
  const { id } = ctx.params

  ctx.state = Object.assign(ctx.state, { 
    title: [
      '添加章节',
      constant.APP_NAME, 
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 返回并渲染首页
  await ctx.fullRender('sectioneditor', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    section: null,
    classicId: id,
    backPage: '/classic/' + id,
    info
  })

  ctx.session.info = null
})

// 编辑章节
router.get('/section/:id/modify', async (ctx, next) => {
  const { id } = ctx.params
  ctx.state = Object.assign(ctx.state, { 
    title: [
      '编辑章节',
      constant.APP_NAME, 
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 查找章节
  let section = await Section.findById(id)
    .select('_id title content audio')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('sectioneditor', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    section,
    classicId: null,
    backPage: '/section/' + id,
    info
  })

  ctx.session.info = null
})

// 编辑章节
router.get('/translate/:id/modify', async (ctx, next) => {
  const { id } = ctx.params
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_HOME_PAGE,
      constant.APP_NAME, 
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 查找翻译
  let translate = await Translate.findById(id)
    .select('_id title content')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('translateeditor', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    translate,
    sectionId: null,
    backPage: '/translate/' + id,
    info
  })

  ctx.session.info = null
})

router.get('/section/:id/translate/create', async (ctx, next) => {
  const { id } = ctx.params
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_HOME_PAGE,
      constant.APP_NAME, 
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 返回并渲染首页
  await ctx.fullRender('translateeditor', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    translate: null,
    sectionId: id,
    backPage: '/section/' + id,
    info
  })

  ctx.session.info = null
})

router.get('/translate/:id/modify', async (ctx, next) => {
  const { id } = ctx.params
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_HOME_PAGE,
      constant.APP_NAME, 
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 查找章节
  let translate = await Translate.findById(id)
    .select('_id title content')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('sectioneditor', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    translate,
    sectionId: null,
    backPage: '/translate/' + id,
    info
  })

  ctx.session.info = null
})

// 翻译内容页
router.get('/translate/:id', async (ctx, next) => {
  const { id } = ctx.params
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_HOME_PAGE,
      constant.APP_NAME, 
    ].join('——')
  })

  const translate = await Translate.findById(id)
    .select('_id section_id title content')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('translate', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    translate,
    backPage: '/section/' + translate.section_id + '/translates'
  })

  ctx.session.info = null
})

// 章节内容页
router.get('/section/:id', async (ctx, next) => {
  const { id } = ctx.params
  , section = await Section.findById(id)
    .select('_id classic_id title content audio')
    .populate('classic', 'title')
    .lean()
  , { classic_id } = section
  , prevSection = await Section.findOne({ 
    _id: { $lt: id }, 
    classic_id
  })
    .select('_id')
    .lean()
  , nextSection = await Section.findOne({ 
    _id: { $gt: id }, 
    classic_id
  })
    .select('_id')
    .lean()

  ctx.state = Object.assign(ctx.state, { 
    title: [
      section.title,
      constant.APP_NAME, 
    ].join('——')
  })

  // 返回并渲染首页
  await ctx.fullRender('section', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    section,
    prevSection,
    nextSection,
    backPage: '/classic/' + section.classic_id
  })

  ctx.session.info = null
})

// 引经内容页
router.get('/classic/:id', async (ctx, next) => {
  // 查找典籍
  let classic_id = ctx.params.id
  , _classicId = mongoose.Types.ObjectId(classic_id)
  , { user } = ctx.state
  //, uid = user && user._id
  //, quoteQuery = Mind.quoteQuery(uid)
  , classics = await Classic.aggregate([
    { $match: { _id: _classicId } },
    { $lookup: {
      from: Mind.collection.name,
      let: { 'mid': '$mind_id' },
      pipeline: [
        { $match: { 
          $expr: { $eq: [ '$_id', '$$mid' ] }
        }},
        Party.partyInfoQuery(),
        { $project: {
          _id: 1,
          content: 1,
          keywords: 1,
          creator_id: 1,
          party: { $cond : [ { $eq : ['$party', []]}, [ null ], '$party'] }
        }},
        { $unwind: '$party'},
        { $project: {
          _id: 1,
          content: 1,
          keywords: 1,
          creator_id: 1,
          party: 1
        }},
      ],
      as: 'mind'
    }},
    { $lookup: {
      from: Reply.collection.name,
      let: { 'mid': '$mind_id' },
      pipeline: [
        { $match: { 
          $expr: { $eq: [ '$parent_id', '$$mid' ] }
        }},
        // 获取公号信息
        Party.partyInfoQuery(),
        // 获取引用
        //...quoteQuery,
        { $project: {
          _id: 1,
          title: 1,
          summary: 1,
          type: 1,
          sub_type: 1,
          reply_type: 1,
          parent_id: 1,
          creator_id: 1,
          party: { $cond : [ { $eq : ['$party', []]}, [ null ], '$party'] },
          //quote_mind: { $cond : [ { $eq : ['$quote_mind', []]}, [ null ], '$quote_mind'] },
          //quote_classic: { $cond : [ { $eq : ['$quote_classic', []]}, [ null ], '$quote_classic'] },
        }},
        { $sort: { created_date: -1 } },
        // { $skip: skip },
        // { $limit: limit },
        { $unwind: '$party'},
        //{ $unwind: '$quote_mind' },
        //{ $unwind: '$quote_classic' },
        { $project: {
          _id: 1,
          title: 1,
          summary: 1,
          type: 1,
          sub_type: 1,
          reply_type: 1,
          creator_id: 1,
          created_date: 1,
          party: 1,
          //quote: { $ifNull: [ '$quote_mind', '$quote_classic' ] },
        }},
      ],
      as: 'replies'
    }},
    { $project: {
      _id: 1,
      title: 1,
      poster: 1,
      content: 1, 
      mind_id: 1,
      creator_id: 1,
      column_id: 1,
      original_author: 1,
      source: 1,
      mind: { $cond : [ { $eq : ['$mind', []]}, [ null ], '$mind'] },
      replies: '$replies'
    }},
    { $unwind: '$mind'},
    { $project: {
      _id: 1,
      title: 1,
      poster: 1,
      content: 1, 
      mind_id: 1,
      creator_id: 1,
      column_id: 1,
      original_author: 1,
      source: 1,
      mind: 1,
      replies: '$replies'
    }}
  ])

  let classic = classics && classics[0]

  // 标题
  ctx.state = Object.assign(ctx.state, { 
    title: [
      classic.title,
      constant.APP_NAME, 
    ].join('——'),
  })

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 来源页错误信息
  let info = ctx.session.info

  // 章节总数
  let total = await Section.countDocuments({ classic_id  })
  let totalPage = Math.ceil(total / limit)
  let pageInfo = null

  const nextPage = page < totalPage ? page + 1 : 0
  if (ctx.state.isXhr) {
    pageInfo = {
      nextPage
    }
  } else {
    pageInfo = {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage
    }
  }

  let sections = await Section.find({
    classic_id: ctx.params.id
  })
    .select('_id title creator_id audio')
    .skip(skip)
    .limit(limit)
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('classic', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    classic,
    sections,
    backPage: '/',
    pageInfo,
    info
  })

  ctx.session.info = null
})

router.get('/classic/:id/sections', async (ctx, next) => {
  // 分页
  let { query } = ctx.request
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit

  // 著作总数
  let total = await Section.estimatedDocumentCount()
  let totalPage = Math.ceil(total / limit)

  let sections = await Section.find({
    classic_id: ctx.params.id
  })
    .select('_id title')
    .skip(skip)
    .limit(limit)
    .lean()

  const nextPage = page < totalPage ? page + 1 : 0
  ctx.body = {
    success,
    pageInfo: {
      nextPage
    },
    sections, 
  }
})

router.get('/section/:id/translates', async (ctx, next) => {
  const { id } = ctx.params
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_HOME_PAGE,
      constant.APP_NAME, 
    ].join('——')
  })

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 来源页错误信息
  let info = ctx.session.info

  // 心语总数
  let total = await Translate.countDocuments({ section_id: id })
  let totalPage = Math.ceil(total / limit)
  let pageInfo = null

  const nextPage = page < totalPage ? page + 1 : 0
  if (ctx.state.isXhr) {
    pageInfo = {
      nextPage
    }
  } else {
    pageInfo = {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage
    }
  }

  // 查找所有记录
  let translates = await Translate.find({
    section_id: id
  })
    .select('_id title creator_id')
    .sort({ created_date: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  // 返回并渲染章节页
  await ctx.fullRender('translates', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    diaryHolder: constant.DIARY_HOLDER,
    features: constant.FEATURES,
    noDataTips: constant.NO_TRANSLATE,
    pageInfo,
    translates,
    backPage: `/section/${id}`,
    info
  })

  ctx.session.info = null
})

// 引经据典编辑页
router.get('/classic/:id/modify', async (ctx, next) => {
  const classId = ctx.params.id
  ctx.state = Object.assign(ctx.state, { 
    title: [
      '编辑作品',
      constant.APP_NAME, 
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 查找所有烦恼
  let classic = await Classic.findById(classId)
    .select('_id title poster content mind_id original_author source column_id')
    .populate('mind', 'content keywords')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('classicmodify', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    shareHolder: constant.SHARE_HOLDER,
    features: constant.FEATURES,
    columns: constant.COLUMNS,
    classic,
    backPage: '/classic/' + classId,
    info
  })

  ctx.session.info = null
})

// 设置
router.get('/config', async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_COMMENT_PAGE,
      constant.APP_NAME, 
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

// 上传图片
router.post('/uploadImg', async (ctx, next) =>{
  try {
    let accessKey = 'tuLyXahBtm_MifuxWpTuOgYQHbygXS2Yyg5ytRNw'  // 源码删除:七牛云获取 ak,必须配置
    let secretKey = '955YhRqvnNBrdbSc_HFEhAGrw6z2K7e43r6zWwDy'  // 源码删除:七牛云获取 sk, 必须配置
    let mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    let options = {
      scope: 'tianye',  // 对应七牛云存储空间名称
      insertOnly: 1,
      expires: 7200 //token过期时间
    }
    let putPolicy = new qiniu.rs.PutPolicy(options)
    let uploadToken = putPolicy.uploadToken(mac)
    let form = formidable.IncomingForm()
    let {respErr, respBody, respInfo, filename} = await new Promise((resolve, reject) => {
      form.parse(ctx.req, function (err, fields, file) {
        if (file) {
          let localFile = file.file.path
          let config = new qiniu.conf.Config()
          let formUploader = new qiniu.form_up.FormUploader(config)
          let putExtra = new qiniu.form_up.PutExtra()
          let key= file.file.name

          crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) {
              reject(err)
              return
            }

            let ext = path.extname(key)
            key = [raw.toString('hex'), ext].join('')
            formUploader.putFile(uploadToken, key, localFile, putExtra, function(respErr, respBody, respInfo) {
              resolve({
                respErr,
                respBody,
                respInfo,
                filename: key
              })
            })
          })
        }
      })
    })
    ctx.body = {
      respErr,
      img: `https://image.tianyeapp.top/${respBody.key}`,//在七牛云上配置域名
      hash: respBody.hash,
      status: respInfo.statusCode,
      filename: respBody.key
    }
  } catch (err) {
    ctx.body = {
      success: false,
      info: err.message || '上传图片失败'
    }
  }
})

// 上传音频
router.post('/uploadAudio', async (ctx, next) =>{
  try {
    let accessKey = 'tuLyXahBtm_MifuxWpTuOgYQHbygXS2Yyg5ytRNw'  // 源码删除:七牛云获取 ak,必须配置
    let secretKey = '955YhRqvnNBrdbSc_HFEhAGrw6z2K7e43r6zWwDy'  // 源码删除:七牛云获取 sk, 必须配置
    let mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    let options = {
      scope: 'audio',  // 对应七牛云存储空间名称
      insertOnly: 1,
      expires: 7200 //token过期时间
    }
    let putPolicy = new qiniu.rs.PutPolicy(options)
    let uploadToken = putPolicy.uploadToken(mac)
    let form = formidable.IncomingForm()
    let {respErr, respBody, respInfo, filename} = await new Promise((resolve, reject) => {
      form.parse(ctx.req, function (err, fields, file) {
        if (file) {
          let localFile = file.file.path
          let config = new qiniu.conf.Config()
          let formUploader = new qiniu.form_up.FormUploader(config)
          let putExtra = new qiniu.form_up.PutExtra()
          let key = file.file.name

          crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) {
              reject(err)
              return
            }

            let ext = path.extname(key)
            key = [raw.toString('hex'), ext].join('')
            formUploader.putFile(uploadToken, key, localFile, putExtra, function(respErr, respBody, respInfo) {
              resolve({
                respErr,
                respBody,
                respInfo,
                filename: key
              })
            })
          })
        }
      })
    })
    ctx.body = {
      respErr,
      audio: `https://audio.tianyeapp.top/${respBody.key}`,//在七牛云上配置域名
      hash: respBody.hash,
      status: respInfo.statusCode,
      filename: respBody.key
    }
  } catch (err) {
    ctx.body = {
      success: false,
      info: err.message || '上传音频失败'
    }
  }
})

// 上传视频
router.post('/uploadVideo', async (ctx, next) =>{
  try {
    let accessKey = 'tuLyXahBtm_MifuxWpTuOgYQHbygXS2Yyg5ytRNw'  // 源码删除:七牛云获取 ak,必须配置
    let secretKey = '955YhRqvnNBrdbSc_HFEhAGrw6z2K7e43r6zWwDy'  // 源码删除:七牛云获取 sk, 必须配置
    let mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    let options = {
      scope: 'tianyevideo',  // 对应七牛云存储空间名称
      insertOnly: 1,
      expires: 7200 //token过期时间
    }
    let putPolicy = new qiniu.rs.PutPolicy(options)
    let uploadToken = putPolicy.uploadToken(mac)
    let form = formidable.IncomingForm()
    let {respErr, respBody, respInfo, filename} = await new Promise((resolve, reject) => {
      form.parse(ctx.req, function (err, fields, file) {
        if (file) {
          let localFile = file.file.path
          let config = new qiniu.conf.Config()
          let formUploader = new qiniu.form_up.FormUploader(config)
          let putExtra = new qiniu.form_up.PutExtra()
          let key= file.file.name

          crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) {
              reject(err)
              return
            }

            let ext = path.extname(key)
            key = [raw.toString('hex'), ext].join('')
            formUploader.put(uploadToken, key, localFile, putExtra, function(respErr, respBody, respInfo) {
              resolve({
                respErr,
                respBody,
                respInfo,
                filename: key
              })
            })
          })
        }
      })
    })
    ctx.body = {
      respErr,
      video: `https://video.tianyeapp.top/${respBody.key}`,//在七牛云上配置域名
      hash: respBody.hash,
      status: respInfo.statusCode,
      filename: respBody.key
    }
  } catch (err) {
    ctx.body = {
      success: false,
      info: err.message || '上传音频失败'
    }
  }
})

// 发布心念并注册
router.post('/newmind', async (ctx) => {
  const body = ctx.request.body || {}
  , { type_id, column_id, content } = body
  , contentClearly = clearFormat(content)
  , contentLength = 
    contentClearly 
    && contentClearly.replace('/\n|\r|\t/gm', '').trim().length
  , sentenceMaxLength = constant.SUMMARY_LIMIT - 3
  , is_extract = contentLength > sentenceMaxLength
  let info = ''
  // 超过限制字数没有使用文章格式
  if (is_extract) {
    if (column_id === constant.COLUMNS.SENTENCE.id) {
      info = `句子内容不能超过${sentenceMaxLength}个字。`
      ctx.body = {
        success: false,
        info
      }
      return
    }
    // 提取摘要
    body.summary = Mind.extract(contentClearly)
  } else {
    body.summary = contentClearly
  }
  // 注册账号
  let password = phoneToken(6, {type: 'string'})
  , buf = await crypto.randomBytes(32)
  , salt = buf.toString('hex')
  , hash = await pbkdf2(password, salt)
  , username = shortid.generate()
  let newUser = await User.create({
    username,
    hash: new Buffer(hash, 'binary').toString('hex'),
    salt: salt
  })
  let party = await Party.create({
    name: username,
    creator_id: newUser._id
  })
  if (type_id === 'share') {
    body.party_id = party && party._id
  }
  body.creator_id = newUser._id
  body.keywords = [...new Set(
    body.keywords 
    && body.keywords.trim().split(/\s+/) 
    || [])
  ]
  try {
    let newMind = await Mind.create(body)
    , docs = body.keywords && body.keywords.map(item => ({ 
      name: item,
      mind_id: newMind._id,
      creator_id: newUser._id
    }))
    await Keyword.insertMany(docs)
    await ctx.login(newUser)
    ctx.body = {
      success: true,
      user: newUser
    }
  } catch (err) {
    info = err.message
    ctx.body = {
      success: false,
      info
    }
  }
})

// 发布心念
router.post('/mind', async (ctx) => {
  const body = ctx.request.body || {}
  , { user } = ctx.state
  , { type_id, column_id, content } = body
  , contentClearly = clearFormat(content)
  , contentLength = 
    contentClearly 
    && contentClearly.replace('/\n|\r|\t/gm', '').trim().length
  , sentenceMaxLength = constant.SUMMARY_LIMIT - 3
  , is_extract = contentLength > sentenceMaxLength
  let info = ''
  // 超过限制字数没有使用文章格式
  if (is_extract) {
    if (column_id === constant.COLUMNS.SENTENCE.id) {
      info = `句子内容不能超过${sentenceMaxLength}个字。`
      ctx.body = {
        success: false,
        info
      }
      return
    }
    // 提取摘要
    body.summary = Mind.extract(contentClearly)
  } else {
    body.summary = contentClearly
  }
  let party = await Party.findOne({ creator_id: user._id }, '_id')
  if (type_id === 'share') {
    body.party_id = party && party._id
  }
  body.creator_id = user._id
  body.keywords = [...new Set(
    body.keywords 
    && body.keywords.trim().split(/\s+/) 
    || [])
  ]
  try {
    let newMind = await Mind.create(body)
    , docs = body.keywords && body.keywords.map(item => ({ 
      name: item,
      mind_id: newMind._id,
      creator_id: user._id
    }))
    await Keyword.insertMany(docs)
    ctx.body = {
      success: true
    }
  } catch (err) {
    info = err.message
    ctx.body = {
      success: false,
      info
    }
  }
})

// 心念更新
router.put('/mind/:id', async (ctx) => {
  const body = ctx.request.body || {}
  , { column_id, content } = body
  , { user } = ctx.state
  , contentClearly = clearFormat(content)
  , contentLength = (
    contentClearly 
    && contentClearly.replace('/\n|\r|\t/gm', '').trim()).length
  , sentenceMaxLength = constant.SUMMARY_LIMIT - 3
  , is_extract = contentLength > sentenceMaxLength
  // 超过限制字数没有使用文章格式
  if (is_extract) {
    if (column_id === constant.COLUMNS.SENTENCE.id) {
      info = `句子内容不能超过${sentenceMaxLength}个字。`
      ctx.body = {
        success: false,
        info
      }
      return
    }
    body.summary = Mind.extract(contentClearly)
  } else {
    body.summary = contentClearly
  }
  body.updated_date = body.state_change_date = new Date()
  body.keywords = body.keywords 
  && body.keywords.trim 
  && [...new Set(body.keywords.trim().split(/\s+/))]
  || []
  try {
    const mind = await Mind.findOneAndUpdate({
      _id: ctx.params.id,
      creator_id: user._id
    }, { 
      $set: body
    }, {
      runValidators: true
    })
    let keywords = mind.keywords || []
    const dels = keywords.filter(item => {
      return body.keywords.indexOf(item) === -1
    })
    const adds = body.keywords.filter(item => {
      return keywords.indexOf(item) === -1
    })
    let docs = adds.map(item => ({ 
      name: item,
      mind_id: mind._id,
      creator_id: user._id
    }))
    await Keyword.deleteMany({ mind_id: mind._id, name: { $in: dels } })
    await Keyword.insertMany(docs)
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
  const body = ctx.request.body || {}
  , { user } = ctx.state
  , { reason, content, column_id, keywords } = ctx.request.body
  , reasonTrim = reason 
    && reason.replace 
    && reason.replace(/\r|\n|\t/gm, '').trim()
  , contentClearly = clearFormat(content)
  , contentLength = 
    contentClearly 
    && contentClearly.replace('/\n|\r|\t/gm', '').trim().length
  , sentenceMaxLength = constant.SUMMARY_LIMIT - 3
  , is_extract = contentLength > sentenceMaxLength
  // 推荐理由不能超过147个字符
  if (reasonTrim.length > sentenceMaxLength) {
    ctx.body = {
      success: false,
      info: `推荐理由不能超过${sentenceMaxLength}个字。`
    }
    return
  }
  // 句子不能超过147个字符
  if (is_extract) {
    if (column_id === constant.COLUMNS.SENTENCE.id) {
      info = `句子内容不能超过${sentenceMaxLength}个字。`
      ctx.body = {
        success: false,
        info
      }
      return
    }
    // 提取摘要
    body.summary = Classic.extract(contentClearly)
  } else {
    body.summary = contentClearly
  }
  body.creator_id = user._id
  let keywordsArr = keywords 
  && keywords.trim 
  && [...new Set(keywords.trim().split(/\s+/))]
  || []
  try {
    let newClassic = new Classic(body)
    let newMind = new Mind({
      type_id: 'share',
      summary: reasonTrim > sentenceMaxLength ? Mind.extract(reasonTrim) : reasonTrim,
      content: reason,
      creator_id: user._id,
      keywords: keywordsArr,
      column_id: 'sentence',
      ref_type: 'classic',
      ref_column: body.column_id,
      perm_id: 'all',
    })
    let docs = keywordsArr && keywordsArr.map(item => ({ 
      name: item,
      mind_id: newMind._id,
      creator_id: user._id
    }))
    newClassic.mind_id = newMind._id
    newMind.ref_id = newClassic._id
    let party = await Party.findOne({ creator_id: user._id }, '_id')
    party && (newMind.party_id = party._id)
    await newClassic.save()
    await newMind.save()
    // 存储关键词
    await Keyword.insertMany(docs)
    ctx.body = {
      success: true,
      works_id: newClassic._id
    }
  } catch (err) {
    ctx.body = {
      success: false,
      info: err.message
    }
  }
})

// 引经据典详情页
router.put('/classic/:id', async (ctx) => {
  const body = ctx.request.body || {}
  , { keywords, content, reason, column_id } = body
  , { user } = ctx.state
  , reasonTrim = reason 
    && reason.replace 
    && reason.replace(/\r|\n|\t/gm, '').trim()
  , contentClearly = clearFormat(content)
  , contentLength = (
    contentClearly 
    && contentClearly.replace('/\n|\r|\t/gm', '').trim()).length
  , sentenceMaxLength = constant.SUMMARY_LIMIT - 3
  , is_extract = contentLength > sentenceMaxLength
  , now = new Date()
  // 推荐理由不能超过147个字符
  if (reasonTrim.length > sentenceMaxLength) {
    ctx.body = {
      success: false,
      info: `推荐理由不能超过${sentenceMaxLength}个字。`
    }
    return
  }
  // 超过限制字数没有使用文章格式
  if (is_extract) {
    if (column_id === constant.COLUMNS.SENTENCE.id) {
      info = `句子内容不能超过${sentenceMaxLength}个字。`
      ctx.body = {
        success: false,
        info
      }
      return
    }
    // 提取摘要
    body.summary = Classic.extract(contentClearly)
  } else {
    body.summary = contentClearly
  }
  body.updated_date = now
  let keywordsArr = keywords 
  && keywords.trim 
  && [...new Set(keywords.trim().split(/\s+/))]
  || []
  try {
    let classic = await Classic.findOneAndUpdate({
      _id: ctx.params.id,
      creator_id: user._id
    }, { 
      $set: body
    }, { 
      runValidators: true 
    })

    let fields = { 
      summary: reasonTrim > sentenceMaxLength ? Mind.extract(reasonTrim) : reasonTrim,
      content: reason,
      updated_date: now,
      state_change_date: now,
      ref_column: body.column_id,
      keywords: keywordsArr
    }
    let mind = await Mind.findOneAndUpdate({
      _id: classic.mind_id
    }, { 
      $set: fields
    }, { 
      runValidators: true 
    })
    let oldKeywords = mind.keywords || []
    const dels = oldKeywords.filter(item => {
      return keywordsArr.indexOf(item) === -1
    })
    const adds = keywordsArr.filter(item => {
      return oldKeywords.indexOf(item) === -1
    })
    let docs = adds.map(item => ({ 
      name: item,
      mind_id: mind._id,
      creator_id: user._id
    }))
    await Keyword.deleteMany({ mind_id: mind._id, name: { $in: dels } })
    await Keyword.insertMany(docs)
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

// 添加章节
router.post('/classic/:id/section', async (ctx) => {
  const { id } = ctx.params
  const { title, content, audio } = ctx.request.body
  const { user } = ctx.state
  const uid = user._id
  const classic = await Classic.findOne({
    _id: id,
    creator_id: uid
  }).select('_id').lean()

  if (!classic) {
    ctx.session.info = constant.SECTION_CLASSIC_NOT_EXIST
  } else {
    try {
      await Section.create({ 
        title,
        content,
        audio,
        classic_id: id,
        creator_id: uid
      })
    } catch (err) {
      ctx.session.info = err.message
    }
  }
  ctx.redirect(`/classic/${id}`)
  ctx.status = 302
})

// 编辑章节
router.put('/section/:id', async (ctx) => {
  const { id } = ctx.params
  const { title, content, audio } = ctx.request.body
  const { user } = ctx.state
  try {
    await Section.findOneAndUpdate({
      _id: id,
      creator_id: user._id
    }, { 
      $set: { title, content, audio },
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

// 添加翻译
router.post('/section/:id/translate', async (ctx) => {
  const { id } = ctx.params
  const { title, content } = ctx.request.body
  const { user } = ctx.state
  const uid = user._id
  const section = await Section.findOne({
    _id: id
  }).select('_id').lean()

  if (!section) {
    ctx.session.info = constant.TRANSLATE_SECTION_NOT_EXIST
  } else {
    try {
      await Translate.create({ 
        title,
        content,
        section_id: id,
        creator_id: uid
      })
    } catch (err) {
      ctx.session.info = err.message
    }
  }
  ctx.redirect(`/section/${id}/translates`)
  ctx.status = 302
})

// 编辑翻译
router.put('/translate/:id', async (ctx) => {
  const { id } = ctx.params
  const { title, content } = ctx.request.body
  const { user } = ctx.state
  try {
    await Translate.findOneAndUpdate({
      _id: id,
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

// 受益和理解
router.post('/thank/:mindId', async (ctx, next) => {
  const { mindId } = ctx.params
  const { typeId } = ctx.request.body
  const { user } = ctx.state
  let mind = await Mind.findById(
    mindId, 
    'creator_id'
  ),
  now = new Date()

  await Reply.updateOne({
    creator_id: user._id,
    parent_id: mindId,
    type: 'emotion'
  }, {
    $set: {
      content: typeId,
      receiver_id: mind.creator_id,
      sub_type: typeId,
      created_date: now
    }
  }, { 
    runValidators: true, 
    upsert: true
  })

  // 更新回复时间
  await Mind.updateOne(
    { _id: mindId },
    { $set: { last_reply_date: now, state_change_date: now }},
    { 
      runValidators: true
    }
  )

  ctx.body = {
    success: true
  }
})

// 取消受益和理解
router.delete('/thank/:mindId', async (ctx, next) => {
  const { mindId } = ctx.params
  const { user } = ctx.state
  await  Reply.remove({
    creator_id: user._id,
    parent_id: mindId,
    type: 'emotion'
  })
  ctx.body = {
    success: true
  }
})

// 回复
router.post('/:type/:id/reply', async (ctx, next) => {
  const body = ctx.request.body || {}
  , { type, id } = ctx.params
  , { user } = ctx.state
  , { column_id, content, parent_id } = body
  , contentClearly = clearFormat(content)
  , contentLength = 
    contentClearly 
    && contentClearly.replace('/\n|\r|\t/gm', '').trim().length
  , sentenceMaxLength = constant.SUMMARY_LIMIT - 3
  , is_extract = contentLength > sentenceMaxLength
  // 超过限制字数没有使用文章格式
  if (is_extract) {
    if (column_id === constant.COLUMNS.SENTENCE.id) {
      info = `句子内容不能超过${sentenceMaxLength}个字。`
      ctx.body = {
        success: false,
        info
      }
      return
    }
    // 提取摘要
    body.summary = Mind.extract(contentClearly)
  } else {
    body.summary = contentClearly
  }
  body.type = 'text'
  body.sub_type = 'text'
  body.reply_id = id
  body.reply_type = type
  body.creator_id = user._id
  let party = await Party.findOne({ creator_id: user._id }, '_id')
  body.party_id = party && party._id
  try {
    let reply = await Reply.create(body)
    , now = new Date()

    // 更新回复时间
    await Mind.updateOne(
      { _id: parent_id },
      { $set: { last_reply_date: now, state_change_date: now }},
      { 
        runValidators: true
      }
    )

    ctx.body = {
      success: true,
      reply
    }
  } catch (err) {
    ctx.body = {
      success: false,
      message: err.message
    }
  }
})

// 取一个笔名
router.post('/nickname', async (ctx) => {
  const { user } = ctx.state
  let { nickname = '' } = ctx.request.body

  // 笔名不能为空
  nickname = nickname.trim()
  if (!nickname) {
    ctx.body = {
      success: false,
      message: constant.NICKNAME_CAN_NOT_EMPTY
    }
    return
  }

  // 保存笔名
  await User.updateOne(
    { _id: user._id },
    { $set: { nickname }},
    { 
      runValidators: true
    }
  )

  ctx.body = {
    success: true
  }
}) 

// 发送添加知己请求
router.post('/friend/:id/send', async (ctx, next) => {
  const { user } = ctx.state,
  { id } = ctx.params,
  { remark, content, shareHelp, shareShare } = ctx.request.body

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
      { $set: { status: 1, remark, shareHelp, shareShare }},
      { 
        runValidators: true, 
        upsert: true
      }
    )
    await Friend.updateOne(
      { recipient: user.id, requester: id },
      { $set: { status: 2, content }},
      {
        runValidators: true, 
        upsert: true
      }
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
  { remark, shareHelp, shareShare } = ctx.request.body

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
        { $set: { status: 3, remark,  shareHelp, shareShare }},
        { 
          runValidators: true
        }
      )
      await Friend.updateOne(
        { recipient: user.id, requester: id },
        { $set: { status: 3 }},
        { 
          runValidators: true
        }
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
      if (isFriend) {
        await Friend.updateOne(
          { recipient: user.id, requester: id },
          { $set: { status: 0 } },
          { 
            runValidators: true
          }
        )
      } else if (isPending) {
        await Friend.updateOne(
          { recipient: user.id, requester: id },
          { $set: { content }, $unset: { remark: 1 } },
          { 
            runValidators: true
          }
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

// 修改备注名
router.put('/friend/:id/remark', async (ctx) => {
  const { user } = ctx.state,
  { id } = ctx.params,
  { remark, shareHelp, shareShare } = ctx.request.body

  await Friend.updateOne(
    { requester: user.id, recipient: id },
    { $set: { remark, shareHelp, shareShare }},
    { 
      runValidators: true
    }
  )

  ctx.body = {
    success: true
  }
})


// 消除心念
router.delete('/mind/:id', async (ctx, next) => {
  // 心念删除后，回复要被回收器自动清理
  try {
    let mind = await Mind.findOneAndRemove({
      creator_id: ctx.state.user.id,
      _id: ctx.params.id
    })
    await Keyword.deleteMany({ mind_id: mind._id, name: { $in: mind.keywords || [] } })
    if (mind.ref_type === 'classic') {
      await Classic.remove({
        _id: mind.ref_id,
      })
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

// 删除章节
router.delete('/section/:id', async (ctx, next) => {
  try {
    let res = await Section.deleteOne({
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

const options = {
  key: fs.readFileSync('./https/2076138_www.tianyeapp.top.key'),
  cert: fs.readFileSync('./https/2076138_www.tianyeapp.top.pem')
}

app
  .use(router.routes())
  .use(router.allowedMethods())

if (process.env.NODE_ENV === 'production') {
  // start the server
  http.createServer(app.callback()).listen(port)
  https.createServer(options, app.callback()).listen(443)
} else {
  app.listen(port, () => {
    console.log(`Tianye app starting at port ${port}`)
  })
}

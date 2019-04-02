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
const Message = require('./models/message')
const Mind = require('./models/mind')
const FeatureVisitor = require('./models/feature_visitor')
const Visitor = require('./models/visitor')
const Share = require('./models/share')
const Classic = require('./models/classic')
const Section = require('./models/section')
const Translate = require('./models/translate')
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
const dbLink = process.env.DBLINK || 'mongodb://localhost:27018/tianye'

//连接mongodb 数据库 ，地址为mongodb的地址以及集合名称。
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true)
mongoose.connect(dbLink, { useNewUrlParser: true })

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
router.get([
  '/notification',
  '/features/mind',
  '/features/help',
  '/friend',
  '/features/diary',
  '/user/search',
  '/help/:id',
  '/recommend/helps',
  '/mind/:id/modify',
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
  '/classic',
  '/thank/:mindId',
  '/:type/:id/reply',
  '/mind/:id',
  '/classic/:id',
  '/reply/:id',
  '/panname',
  '/friend/:id/send',
  '/friend/:id/accept',
  '/friend/:id/remove',
  '/classic/:id/section',
  '/section/:id',
  '/section/:id/translate',
  '/translate/:id',
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
router.get('/', (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: constant.APP_NAME,
  })

  return ctx.render('index', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN
  })
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

function loginPromise(ctx) {
  return new Promise((resove, reject) => {
    passport.authenticate('local', (err, user, info, status) => {
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
  let loginRes = await loginPromise(ctx)
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
    username = '', 
    password = '',
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
                  redirectUrl: currentUrl,
                  user
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
    /*await transporter.sendMail({
      // 发件人
      from: '<qqmmgg123@126.com>',
      // 主题
      subject: '验证码',//邮箱主题
      // 收件人
      to: email,//前台传过来的邮箱
      // 邮件内容，HTML格式
      text: '用 ' + code + ' 作为你的验证码'
    })*/
    let result = await new Promise((res, rej) => {
      setTimeout(() => {
        res('用 ' + code + ' 作为你的验证码')
      }, )
    })
    console.log(result)
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
router.get([
  '/features/diary',
  '/features/help',
  '/features/share',
  '/features/classic',
  '/help/:id',
  '/share/:id',
  '/classic/:id',
  '/friend',
], (ctx, next) => {
  ctx.session.currentUrl = ctx.url
  return next()
})

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
        Friend.lastReplyMatch(uid),
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
  let karmaTalkVisit = await FeatureVisitor.findOne({
    visitor_id: uid,
    feature: 'talk'
  }, 'visited_date')

  let friendshipMatch = await Friend.friendshipMatch()
  friendshipMatch.$match.$expr.$and.push({
    $gt: [ '$created_date',  karmaTalkVisit ? karmaTalkVisit.visited_date : null ]
  })
  let karmaTalkNew = await Mind.aggregate([
    ...Friend.friendshipQuery(uid),
    { $unwind: '$recipient'},
    { $unwind: '$requester'},
    friendshipMatch,
    { $count: 'total' }
  ])

  // 查找“缘谈心”消息提示
  let talkReplyNew = await Mind.aggregate([
    ...Friend.friendshipQuery(uid),
    { $unwind: '$recipient'},
    { $unwind: '$requester'},
    Friend.friendshipMatch(),
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

  let notification = []
  let mindReplyCount = mindReplyNew && mindReplyNew[0] && mindReplyNew[0].total || 0
  mindReplyCount && notification.push({
    feature: 'mind',
    has_new: true,
    toatl: mindReplyCount
  })

  let talkReplyCount = talkReplyNew && talkReplyNew[0] && talkReplyNew[0].total || 0
  let karmaTalkCount = karmaTalkNew && karmaTalkNew[0] && karmaTalkNew[0].total || 0
  if (talkReplyCount || karmaTalkCount) {
      notification.push({
      feature: 'karma',
      has_new: true,
      sub_feature: [{
        feature: 'talk',
        reply_total: talkReplyCount,
        mind_total: karmaTalkCount,
        has_new: true
      }], 
    })
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

// 有缘人
router.get('/friend', async (ctx, next) => {
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
      { $project: {
        status: 1,
        content: 1,
        remark: 1,
        shareHelp: 1,
        shareShare: 1,
        recipient_status: { '$ifNull': [ { "$min": "$friend.status" }, 0 ] },
        recipient_id: '$user._id',
        recipient_name: '$user.panname',
      }}
    ]
  )

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
    .select('_id panname')

  ctx.body = {
    success: true,
    profile,
  }
})

// 查找用户
router.get('/user/search', async (ctx, next) => {
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
router.get('/features/mind', async (ctx, next) => {
  let { user } = ctx.state

  let quoteQuery = Classic.quoteQuery()

  // 分页
  let { query } = ctx.request
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let condition = {
    creator_id: user._id
  }

  // 心念总数
  let total = await Mind.countDocuments(condition)
  let totalPage = Math.ceil(total / limit)
  let pageInfo = {
    nextPage: page < totalPage ? page + 1 : 0
  }

  // 查找所有记录
  let minds = await Mind.aggregate([
    { $match: condition },
    Visitor.queryVisitor(user._id),
    { $lookup: {
      from: Reply.collection.name,
      let: { 'mind_id': '$_id' },
      pipeline: [
        { $match: { 
          $expr: { $eq: [ '$parent_id', '$$mind_id' ] }
        }},
        // 查询回复创建者信息
        User.authorInfoQuery(),
        Friend.requesterQuery(user._id),
        // 获取引用
        quoteQuery,
        { $project: {
          creator_id: 1,
          content: 1,
          created_date: 1,
          author: { $cond : [ { $eq : ['$author', []]}, [ null ], '$author'] },
          friend: { $cond : [ { $eq : ['$friend', []]}, [ null ], '$friend'] }
        }},
        { $unwind: '$author' },
        { $unwind: '$friend' },
        { $project: {
          creator_id: 1,
          content: 1,
          created_date: 1,
          author: 1,
          friend: 1
        }},
        { $sort: { created_date: -1 } },
        { $limit: 1 }
      ],
      as: 'new_reply'
    }},
    // 获取引用
    quoteQuery,
    { $project: {
      _id: 1, 
      type_id: 1, 
      column_id: 1, 
      title: 1, 
      is_extract: 1, 
      summary: 1, 
      creator_id: 1,
      created_date: 1,
      updated_date: 1,
      visitor: { $cond : [ { $eq : ['$visitor', []]}, [ null ], '$visitor'] },
      quote: { $cond : [ { $eq : ['$quote', []]}, [ null ], '$quote'] },
      new_reply: { $cond : [ { $eq : ['$new_reply', []]}, [ null ], '$new_reply'] },
      state_change_date: 1
    }},
    { $unwind: '$visitor' },
    { $unwind: '$new_reply' },
    { $unwind: '$quote' },
    { $project: {
      _id: 1, 
      type_id: 1, 
      column_id: 1, 
      title: 1, 
      is_extract: 1, 
      summary: 1, 
      creator_id: 1,
      created_date: 1,
      updated_date: 1,
      has_new: 1,
      quote: 1,
      new_reply: 1,
      reply_visit_date: { $cond : [ { $ne : ['$visitor', null]}, '$visitor.visited_date', '$created_date'] },
      last_reply_date: { $cond : [ { $ne : ['$new_reply', null]}, '$new_reply.created_date', '$created_date'] },
      state_change_date: { $cond : [ { $ne : ['$new_reply', null]}, '$new_reply.created_date', '$state_change_date'] },
    }},
    { $sort: { state_change_date: -1 } },
    { $skip: skip },
    { $limit: limit }
  ])

  // 返回并渲染首页
  ctx.body = {
    success: true,
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    noDataTips: constant.NO_MIND,
    pageInfo,
    minds,
  }
})

// 尘
router.get('/features/earth', async (ctx, next) => {
  // 分页
  let { query } = ctx.request
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit

  // 心念总数
  let total = await Mind.estimatedDocumentCount()
  let totalPage = Math.ceil(total / limit)
  const nextPage = page < totalPage ? page + 1 : 0
  const pageInfo = {
    nextPage
  }

  const { user } = ctx.state
  , condition = {
    type_id: { $in: ['help', 'share'] },
  }

  const uid = user && user._id
  if (uid) {
    condition.creator_id = { $ne: uid }
  }

  // 查找所有记录
  let minds = await Mind.find(condition)
  .select([
    '_id', 
    'type_id', 
    'column_id', 
    'title', 
    'content', 
    'is_extract', 
    'summary', 
    'created_date', 
    'creator_id'].join(' '))
  .sort({ state_change_date: -1 })
  .skip(skip)
  .limit(limit)
  .lean()

  if (uid) {
    // 受益状态
    let mindIds = minds.map(mind => mind._id)
    const thankQueryCondition = {
      basis_id: { $in: mindIds }
    }
    thankQueryCondition.winner_id = { $ne: uid }
    let thanks = await Thank.find(thankQueryCondition).lean()
    minds = minds.map(mind => {
      mind.isThanked = thanks.findIndex(
        thank => thank.basis_id.equals(mind._id)) > -1
      return mind
    })
  }

  ctx.set('cookie', ctx.request.header.cookies)

  // 返回并渲染首页
  ctx.body = {
    success: true,
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    pageInfo,
    minds,
  }
})

// 投缘
router.get('/features/diary', async (ctx, next) => {
  let { user } = ctx.state

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2

  let fateMatch = {
    $match: { 
      $expr: {
        $or: [
          { "$eq": [ "$giver_id", user._id ] }, 
          { "$eq": [ "$winner_id", user._id ] }
        ]
      }
    }
  }

  // 心语总数
  let totalQueryResult = await Thank.aggregate(
    [
      fateMatch,
      { $group: { _id: '$giver_id', total: { $sum: 1 } } },
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
  let diarys = await Thank.aggregate(
    [
      fateMatch,
      {
        $project: {
          giver_id: 1,
          winner_id: 1,
          user_id: {
            $cond: {
              if: { '$eq': [ '$winner_id', user._id ] },
              then: '$giver_id',
              else: '$winner_id'
            }
          },
          type_id: 1,
         oThanks: {
            $cond: {
              if: { '$eq': [ '$giver_id', user._id ] },
              then: {            
                $cond: {
                  if: { $eq: ['$type_id', 'thank'] },
                  then: 1,
                  else: 0
                }
              },
              else: 0
            }
          },
          oUnderstands: {
            $cond: {
              if: { '$eq': [ '$giver_id', user._id ] },
              then: {            
                $cond: {
                  if: { $eq: ['$type_id', 'understand'] },
                  then: 1,
                  else: 0
                }
              },
              else: 0
            }
          },
          mThanks: {
            $cond: {
              if: { '$eq': [ '$winner_id', user._id ] },
              then: {            
                $cond: {
                  if: { $eq: ['$type_id', 'thank'] },
                  then: 1,
                  else: 0
                }
              },
              else: 0
            }
          },
          mUnderstands: {
            $cond: {
              if: { '$eq': [ '$winner_id', user._id ] },
              then: {            
                $cond: {
                  if: { $eq: ['$type_id', 'understand'] },
                  then: 1,
                  else: 0
                }
              },
              else: 0
            }
          },
        }
      },
      {
        $group : {
          _id : '$user_id',
          mThankTotal: { $sum: '$mThanks' },
          mUnderstandTotal: { $sum: '$mUnderstands' },
          oThankTotal: { $sum: '$oThanks' },
          oUnderstandTotal: { $sum: '$oUnderstands' },
        }
      },
      { $lookup: {
        from: Friend.collection.name,
        let: { 'user_id': '$_id' },
        pipeline: [{ 
          $match: { 
            requester: user._id,
            $expr: { $eq: [ '$recipient', '$$user_id' ] }
          }
        }],
        as: 'requester'
      }},
      { $lookup: {
        from: Friend.collection.name,
        let: { 'user_id': '$_id' },
        pipeline: [{ 
          $match: { 
            recipient: user._id,
            $expr: { $eq: [ '$requester', '$$user_id' ] }
          }
        }],
        as: 'recipient'
      }},
      { $lookup: {
        from: User.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'giver'
      }},
      { $unwind: '$giver' },
      {
        $match: { 
          $expr: {
            $and: [
              {
                $eq: [{
                  $ifNull: [{ 
                    $min: '$requester.status' 
                  }, 0]
                }, 0] 
              }, {
                $eq: [{
                  $ifNull: [{ 
                    $min: '$recipient.status' 
                  }, 0]
                }, 0] 
              }, 
            ]
          }, 
        }
      },
      {
        $project: {
          _id: 1,
          panname: '$giver.panname',
          oThankTotal: 1,
          oUnderstandTotal: 1,
          mThankTotal: 1,
          mUnderstandTotal: 1,
          total: { 
            $add: [
              '$mThankTotal', 
              '$mUnderstandTotal', 
              '$oThankTotal', 
              '$oUnderstandTotal'
            ] 
          }
        }
      },
      { $sort: { 'total': -1 } },
      { $skip: skip },
      { $limit: limit }
    ]
 )

  // 返回并渲染首页
  ctx.body = {
    success: true,
    pageInfo,
    diarys
  }
})

// 谈心
router.get('/features/help', async (ctx, next) => {
  let { user } = ctx.state

  // 有缘人关系
  let friendshipQuery = Friend.friendshipQuery(user._id)
  let friendshipMatch = Friend.friendshipMatch()
  let requesterQuery = Friend.requesterQuery(user._id)
  let authorInfoQuery = User.authorInfoQuery()
  let quoteQuery = Classic.quoteQuery()

  // 分页
  let { query } = ctx.request
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit

  // 有缘人心事数目
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
  let pageInfo = {
    nextPage: page < totalPage ? page + 1 : 0
  }

  // 查找有缘人的心事
  let helps = await Mind.aggregate([
    ...friendshipQuery,
    { $unwind: '$recipient'},
    { $unwind: '$requester'},
    friendshipMatch,
    Visitor.queryVisitor(user._id),
    // 查询心念创建者信息
    authorInfoQuery,
    requesterQuery,
    // 查找最新回复
    { $lookup: {
      from: Reply.collection.name,
      let: { 'mind_id': '$_id' },
      pipeline: [
        ...friendshipQuery,
        Friend.lastReplyfriendshipMatch(user._id),
        { $project: {
          created_date: 1
        }},
        { $sort: { created_date: -1 } },
        { $limit: 1 }
      ],
      as: 'last_reply'
    }},
    // 查询我回复
    { $lookup: {
      from: Reply.collection.name,
      let: { 'mind_id': '$_id' },
      pipeline: [
        // 心事回复匹配是否为有缘人关系
        ...friendshipQuery,
        Friend.newReplyfriendshipMatch(user._id),
        // 查询回复创建者信息
        authorInfoQuery,
        requesterQuery,
        // 获取引用
        quoteQuery,
        { $project: {
          creator_id: 1,
          content: 1,
          created_date: 1,
          author: { $cond : [ { $eq : ['$author', []]}, [ null ], '$author'] },
          friend: { $cond : [ { $eq : ['$friend', []]}, [ null ], '$friend'] }
        }},
        { $unwind: '$author' },
        { $unwind: '$friend' },
        { $project: {
          creator_id: 1,
          content: 1,
          created_date: 1,
          author: 1,
          friend: 1
        }},
        { $sort: { created_date: -1 } },
        { $limit: 1 }
      ],
      as: 'new_reply'
    }},
    // 获取引用
    quoteQuery,
    { $project: {
      _id: 1, 
      type_id: 1, 
      column_id: 1, 
      title: 1, 
      author: { $cond : [ { $eq : ['$author', []]}, [ null ], '$author'] },
      friend: { $cond : [ { $eq : ['$friend', []]}, [ null ], '$friend'] },
      is_extract: 1, 
      summary: 1, 
      creator_id: 1,
      created_date: 1,
      updated_date: 1,
      visitor: { $cond : [ { $eq : ['$visitor', []]}, [ null ], '$visitor'] },
      quote: { $cond : [ { $eq : ['$quote', []]}, [ null ], '$quote'] },
      new_reply: { $cond : [ { $eq : ['$new_reply', []]}, [ null ], '$new_reply'] },
      last_reply: { $cond : [ { $eq : ['$last_reply', []]}, [ null ], '$last_reply'] },
      state_change_date: 1
    }},
    { $unwind: '$author' },
    { $unwind: '$friend' },
    { $unwind: '$visitor' },
    { $unwind: '$new_reply' },
    { $unwind: '$last_reply' },
    { $unwind: '$quote' },
    { $project: {
      _id: 1, 
      type_id: 1, 
      column_id: 1, 
      title: 1, 
      author: 1,
      friend: 1,
      is_extract: 1, 
      summary: 1, 
      creator_id: 1,
      created_date: 1,
      updated_date: 1,
      has_new: 1,
      quote: 1,
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

  // 没有内容时查询是否有有缘人
  let friendTotal = 1
  if (!helps || !helps.length) {
    friendTotal = await Friend.getFriendTotal(user._id)
  }

  console.log(typeof query.isVisit)
  // 更新访问时间
  if (query.isVisit) {
    let now = new Date()
    await FeatureVisitor.updateOne({
      visitor_id: user._id,
    }, 
    { $set: { 
      feature: 'talk',
      visited_date: now
    }},     
    {
      runValidators: true, 
      upsert: true,
      //new: true
    })
  }

  ctx.body = {
    success: true,
    friendTotal,
    pageInfo,
    helps,
  }
})

// 获取具体排忧解难
// TODO 需要判断当前心事是否已经有了回复
router.get('/help/:id', async (ctx, next) => {
  let { user } = ctx.state

  // 分页
  let { query } = ctx.request
  let range = +query.range || constant.PAGE_RANGE
  let page = +query.page || 1
  let limit = +query.limit || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index
  
  let troubleId = mongoose.Types.ObjectId(ctx.params.id)
  let helps = await Mind.aggregate(
    [
      { $lookup: {
        from: User.collection.name,
        localField: 'creator_id',
        foreignField: '_id',
        as: 'user'
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
            'from': Friend.collection.name,
            'let': { 'receiver_id': '$receiver_id' },
            'pipeline': [{ 
              '$match': { 
                'requester': user._id,
                "$expr": { "$eq": [ "$recipient", "$$receiver_id" ] }
              }
            }],
            'as': 'rreceiver'
          }},
          { '$lookup': {
            'from': Classic.collection.name,
            'localField': 'ref_id',
            'foreignField': '_id',
            'as': 'classic'
          }},
          { '$match': {  '$expr': {'$and': [{ "$eq": [ "$parent_id", "$$trouble_id" ] }, { '$or': [{ '$and': [{ '$eq': [{ '$min': '$recipient.status' }, 3] }, { '$eq': [{ '$min':'$requester.status' }, 3] }] }, { '$eq': ['$creator_id', user._id ]}]}]}}},
          { '$group': { '_id': '$parent_id', 'data':{ '$push':{ 'rs': '$$ROOT', 'us': '$user', 'rus': '$receiver', 'rec': '$recipient', 'rrec': '$rreceiver', 'ref': '$classic' } }, 'count': { '$sum': 1 } } },
          { '$unwind': '$data' },
          {
            '$project': {
              '_id': '$data.rs._id',
              'content': "$data.rs.content",
              'reply_type': "$data.rs.reply_type",
              'creator_id': "$data.rs.creator_id",
              'created_date': "$data.rs.created_date",
              'username': '$data.us.panname',
              'remark': '$data.rec.remark',
              'receivername': '$data.rus.panname',
              'rremark': '$data.rrec.remark',
              'ref_id': '$data.ref._id',
              'ref_title': '$data.ref.title',
              'ref_summary': '$data.ref.summary',
              'count': 1
            }
          },
          { '$sort': { 'created_date': -1 } },
          { '$skip' : skip },
          { "$limit": limit }
        ],
        'as': 'replies'
      }},
      { '$match': { '_id': troubleId }},
      { '$project': {
        '_id': 1,
        'type_id': 1,
        'content': 1,
        'replies': '$replies',
        'creator_id': 1,
        'last_reply_date': 1,
        'created_date': 1,
        'username': '$user.panname',
        // 'remark': '$recipient.remark',
        'reply_count': { '$max': '$replies.count'}
      }}
    ]
  )
  
  let help = helps && helps.length && helps[0],
  now = new Date()

  // 更新访问时间
  await Visitor.updateOne({
    visitor_id: user._id,
    basis_id: help._id,
  }, 
  { $set: { 
    visited_date: now
  }},     
  {
    runValidators: true, 
    upsert: true,
    // new: true
  })

  // 我的烦恼总数
  let totalPage = Math.ceil(help.reply_count / limit)

  ctx.body = {
    success: true,
    noDataTips: constant.NO_MINE_TROUBLE,
    pageInfo: {
      currPage: page,
      prevPage: page > 1 ? page - 1 : 0,
      pages: pageRange(
        Math.max(1, page + 1 - index), 
        Math.min(totalPage, page + lastIndex)
      ),
      nextPage: page < totalPage ? page + 1 : 0,
    },
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
  let helps = await Mind.aggregate(
    [
      ...friendshipQuery,
      { '$lookup': {
        'from': User.collection.name,
        'localField': 'creator_id',
        'foreignField': '_id',
        'as': 'user'
      }},
      { $unwind: '$recipient'},
      { $unwind: '$requester'},
      friendshipMatch,
      { '$project': {
        '_id': 1,
        'content': 1,
        'creator_id': 1,
        'last_reply_date': 1,
        'created_date': 1,
        'username': '$user.panname',
        'remark': '$recipient.remark'
      }},
      { '$sort': { 'last_reply_date': -1, 'created_date': -1 } },
      { '$skip' : skip },
      { "$limit": limit }
    ]
  )

  // 没有内容时查询是否有有缘人
  let friendTotal = 1
  if (!helps || !helps.length) {
    //friendTotal = await Friend.getFriendTotal(user._id)
  }
  
  ctx.body = {
    success: true,
    noDataTips: constant.NO_TROUBLE,
    friendTotal,
    pageInfo,
    helps
  }
})

// 原创分享
router.get('/features/share', async (ctx, next) => {
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
  let limit = +query.perPage || constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 来源页错误信息
  let info = ctx.session.info

  // 烦恼总数
  let total = await Share.estimatedDocumentCount()
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
  let shares = await Share.find({})
    .populate('author', 'panname')
    .select('_id column_id title summary creator_id is_extract')
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

  // 赞叹状态
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
    noDataTips: constant.No_SHARE,
    pageInfo,
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

  // 赞叹状态
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

// 心念
router.get('/mind/:id', async (ctx, next) => {
  let mindId = ctx.params.id
  let mind = await Mind.findById(mindId)
    .select('_id type_id column_id title content state_change_date')
    .lean()

  ctx.body = {
    success: true,
    mind
  }
})

// 添加章节
router.get('/classic/:id/section/create', async (ctx, next) => {
  const { id } = ctx.params

  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
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
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 来源页错误信息
  let info = ctx.session.info

  // 查找章节
  let section = await Section.findById(id)
    .select('_id title content')
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
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
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
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
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
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
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
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
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
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  const section = await Section.findById(id)
    .select('_id classic_id title content')
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('section', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    features: constant.FEATURES,
    section,
    backPage: '/classic/' + section.classic_id
  })

  ctx.session.info = null
})

// 引经内容页
router.get('/classic/:id', async (ctx, next) => {
  ctx.state = Object.assign(ctx.state, { 
    title: [
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
    ].join('——')
  })

  // 查找典籍
  let classic = await Classic.findById(
    ctx.params.id)
    .select('_id title poster summary content')
    .lean()

  // 分页
  let range = constant.PAGE_RANGE
  let page = 1
  let limit = constant.LIST_LIMIT
  let skip = (page - 1) * limit
  let index = range / 2
  let lastIndex = range - index

  // 来源页错误信息
  let info = ctx.session.info

  // 章节总数
  let total = await Section.estimatedDocumentCount()
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
    .select('_id title')
    .skip(skip)
    .limit(limit)
    .lean()

  // 返回并渲染首页
  await ctx.fullRender('classic', {
    appName: constant.APP_NAME,
    slogan: constant.APP_SLOGAN,
    classic,
    sections,
    backPage: '/features/classic',
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
      constant.APP_NAME, 
      constant.APP_HOME_PAGE
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

// 发布心念
router.post('/mind', async (ctx) => {
  const { type_id, content, title, column_id, ref_id } = ctx.request.body
  const { user } = ctx.state
  let info = ''
  try {
    await Mind.create({ 
      type_id,
      title,
      content,
      creator_id: user.id,
      column_id,
      ref_id
    })
  } catch (err) {
    info = filterMsg(err.message)
  }
  if (!info) {
    ctx.body = {
      success: true
    }
  } else {
    ctx.body = {
      success: false,
      info,
    }
  }
})

// 心念更新
router.put('/mind/:id', async (ctx) => {
  const { type_id, content, title, column_id } = ctx.request.body
  const { user } = ctx.state
  const is_extract = content.length > constant.SUMMARY_LIMIT - 3
  const summary = is_extract
    ? Share.extract(content)
    : content 
  const now = new Date()
  try {
    await Mind.updateOne({
      _id: ctx.params.id,
      creator_id: user._id
    }, { 
      $set: { 
        type_id, 
        title, 
        summary, 
        content, 
        column_id, 
        is_extract,
        updated_date: now,
        state_change_date: now,
      },
    }, { 
      runValidators: true,
      upsert: true
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

// 添加章节
router.post('/classic/:id/section', async (ctx) => {
  const { id } = ctx.params
  const { title, content } = ctx.request.body
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
  const { title, content } = ctx.request.body
  const { user } = ctx.state
  try {
    await Section.findOneAndUpdate({
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
  )
  await Thank.create({
    type_id: typeId,
    giver_id: user.id,
    winner_id: mind.creator_id,
    basis_id: mindId,
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

    let now = new Date()

    // 更新回复时间
    await Mind.updateOne(
      { _id: parent_id },
      { $set: { last_reply_date: now, last_reply_id: reply._id, state_change_date: now }},
      { 
        runValidators: true,
        upsert: true
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
router.post('/panname', async (ctx) => {
  const { user } = ctx.state
  let { panname = '' } = ctx.request.body

  // 笔名不能为空
  panname = panname.trim()
  if (!panname) {
    ctx.body = {
      success: false,
      message: constant.PANNAME_CAN_NOT_EMPTY
    }
    return
  }

  // 保存笔名
  await User.updateOne(
    { _id: user._id },
    { $set: { panname }},
    { 
      runValidators: true,
      upsert: true
    }
  )

  ctx.body = {
    success: true
  }
}) 

// 发送添加有缘人请求
router.post('/friend/:id/send', async (ctx, next) => {
  const { user } = ctx.state,
  { id } = ctx.params,
  { remark, content, shareHelp, shareShare } = ctx.request.body

  // 不能添加自己为有缘人
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

    // 对方已经是自己有缘人
    if (relation.status === 3 && relation.recipient_status === 3) {
      ctx.body = {
        success: false,
        message: constant.FRIEND_EXISTS
      }
      return
    }
    
    // 您已经发起了将对方添加为有缘人的申请
    if (relation.status === 1 && relation.recipient_status === 2) {
      ctx.body = {
        success: false,
        message: constant.OTHER_FRIEND_REQUESTING
      }
      return
    }

    // 对方正在申请您为有缘人
    if (relation.status === 2 && relation.recipient_status === 1) {
      ctx.body = {
        success: false,
        message: constant.MINE_FRIEND_REQUESTING
      }
      return
    }
  
    // 更新有缘人状态
    await Friend.updateOne(
      { requester: user.id, recipient: id },
      { $set: { status: 1, remark, shareHelp, shareShare }},
      { 
        runValidators: true, 
        upsert: true, 
        new: true 
      }
    )
    await Friend.updateOne(
      { recipient: user.id, requester: id },
      { $set: { status: 2, content }},
      {
        runValidators: true, 
        upsert: true, 
        new: true 
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

// 同意添加有缘人请求
router.put('/friend/:id/accept', async (ctx, next) => {
  const { user } = ctx.state,
  { id } = ctx.params,
  { remark, shareHelp, shareShare } = ctx.request.body

  // 不能添加自己为有缘人
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

    // 对方已经是自己有缘人
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

// 删除有缘人关系
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

    // 发送消息给对方
    /* await Message.updateOne({ 
      recipient: id,
      feature: 'karma',
      sub_feature: 'friend',
    }, 
    { $set: { 
      recipient: id,
      feature: 'karma',
      sub_feature: 'friend',
      has_new: true
    }},     
    {
      upsert: true, 
      new: true 
    }) */

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
    let res = await Mind.deleteOne({
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

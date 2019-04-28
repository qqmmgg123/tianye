const passport = require('koa-passport')
const User = require('./models/user')
const Verification = require('./models/verification')
const utils = require('./utils')
const scmp = require('scmp')
const constant = require('./settings/const')

// This is an example! Use password hashing in your project and avoid storing passwords in your code
async function verifyPassword(username, password) {
  const user = await User.findOne({ email: username.trim() }).select('hash salt nickname email')
  if (user) {
    const hashRaw = await utils.pbkdf2(password, user.salt)
    let hash = new Buffer(hashRaw, 'hex')//.toString('hex')
    // hash = Buffer.from(hash, 'hex');
    const userHash = new Buffer(user.hash, 'hex')
    if (scmp(hash, userHash)) {
      // console.log(user)
      return user
    } else {
      throw new Error(constant.PASSWORD_ERROR)
    }
  } else {
    throw new Error(constant.USER_NOT_EXISTS)
  }
}

async function verifyCode(email, code) {
  email = email.trim()
  const user = await User.findOne({ email }).select('nickname email')
  if (user) {
    let vcode = await Verification.findOne({ 
      email: email,
      code: code
    }, 'email code').lean()
  
    if (vcode) {
      return user
    } else {
      throw new Error(constant.VCODE_ERROR)
    }
  } else {
    throw new Error(constant.USER_NOT_EXISTS)
  }
}

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch(err) {
    done(err)
  }
})

const LocalStrategy = require('passport-local').Strategy
passport.use(new LocalStrategy({
  usernameField: 'email'
}, function(username, password, done) {
  verifyPassword(username, password)
    .then(user => {
      done(null, user)
    })
    .catch(err => done(err))
}))

const VcodeStrategy = require('./passport-code').Strategy
passport.use(new VcodeStrategy(
  function(email, code, done) {
    verifyCode(email, code)
      .then(user => {
        done(null, user)
      })
      .catch(err => done(err))
  }
))

const passport = require('koa-passport')
const User = require('./models/user')
const utils = require('./utils')
const scmp = require('scmp')
const constant = require('./settings/const')

// This is an example! Use password hashing in your project and avoid storing passwords in your code
async function fetchUser(username, password) {
  const user = await User.findOne({ username }).select('hash salt username panname email')
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
    throw new Error(constant.USERNAME_ERROR)
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
passport.use(new LocalStrategy(function(username, password, done) {
  fetchUser(username, password)
    .then(user => {
      done(null, user)
    })
    .catch(err => done(err))
}))

const QqStrategy = require('passport-qq').Strategy
passport.use(new QqStrategy({
    clientID: 'your-client-id',
    clientSecret: 'your-secret',
    callbackURL: 'http://localhost:' + (process.env.PORT || 3000) + '/auth/qq/callback'
  },
  function (token, tokenSecret, profile, done) {
    // retrieve user ...
    fetchUser().then(user => done(null, user))
  }
))

const FacebookStrategy = require('passport-facebook').Strategy
passport.use(new FacebookStrategy({
    clientID: 'your-client-id',
    clientSecret: 'your-secret',
    callbackURL: 'http://localhost:' + (process.env.PORT || 3000) + '/auth/facebook/callback'
  },
  function(token, tokenSecret, profile, done) {
    // retrieve user ...
    fetchUser().then(user => done(null, user))
  }
))

const TwitterStrategy = require('passport-twitter').Strategy
passport.use(new TwitterStrategy({
    consumerKey: 'your-consumer-key',
    consumerSecret: 'your-secret',
    callbackURL: 'http://localhost:' + (process.env.PORT || 3000) + '/auth/twitter/callback'
  },
  function(token, tokenSecret, profile, done) {
    // retrieve user ...
    fetchUser().then(user => done(null, user))
  }
))

const GoogleStrategy = require('passport-google-auth').Strategy
passport.use(new GoogleStrategy({
    clientId: 'your-client-id',
    clientSecret: 'your-secret',
    callbackURL: 'http://localhost:' + (process.env.PORT || 3000) + '/auth/google/callback'
  },
  function(token, tokenSecret, profile, done) {
    // retrieve user ...
    fetchUser().then(user => done(null, user))
  }
))
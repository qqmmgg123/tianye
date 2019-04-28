let mongoose = require('mongoose')
, scmp = require('scmp')
, crypto = require('crypto')
, constant = require('../settings/const')
, User = require('../schemas/user')
, utils = require('../utils')

// 获取作者信息
User.statics.authorInfoQuery = function() {
  return { $lookup: {
    from: this.collection.name,
    let: { 'user_id': '$creator_id' },
    pipeline: [
      { $match: { 
        $expr: { $eq: [ '$_id', '$$user_id' ] }
      }},
      { $project: {
        nickname: 1
      }},
    ],
    as: 'author'
  }}
}

// 获取接受者信息
User.statics.receiverInfoQuery = function() {
  return { $lookup: {
    from: this.collection.name,
    let: { 'user_id': '$receiver_id' },
    pipeline: [
      { $match: { 
        $expr: { $eq: [ '$_id', '$$user_id' ] }
      }},
      { $project: {
        nickname: 1
      }},
    ],
    as: 'receiver'
  }}
}

// 更新密码
User.methods.setPassword = async function(password) {
  if (!password) {
    throw new Error(constant.MISSING_PASSWORD_ERROR)
  }

  let buf = await crypto.randomBytes(32)
  , salt = buf.toString('hex')
  , hash = await utils.pbkdf2(password, salt)

  this.set('hash', new Buffer(hash, 'binary').toString('hex'));
  this.set('salt', salt);
  let user = await this.save()
  return user
}

// 修改密码
User.methods.updatePassword = async function(
  password_old, 
  password_new,
  password_re,
) {
  if (!password_old || !password_new || !password_re) {
    throw new Error(constant.MISS_PARAMS)
  }
  if (password_new !== password_re) {
    throw new Error(constant.PASSWORD_DIFFERENT_ERROR)
  }
  const hashRaw = await utils.pbkdf2(password_old, this.get('salt'))
  let hash = new Buffer(hashRaw, 'hex')//.toString('hex')
  const userHash = new Buffer(this.get('hash'), 'hex')
  if (scmp(hash, userHash)) {
    if (password_old == password_new) {
      throw new Error(constant.PASSWORD_SAME_ERROR)
    }
    let user = await this.setPassword(password_new)
    return user
  } else {
    throw new Error(constant.INCORRECT_OLD_PASSWORD_ERROR)
  }
}

module.exports = mongoose.model('User', User)

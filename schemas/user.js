const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let userSchema = new Schema({
  username: { 
    type: String, 
    unique: true, 
    trim: true, 
    maxlength: [24, constant.USERNAME_MAXLEN_ERROR]
  },
  phone: { 
    type: String, 
    unique: true, 
    required: [true, constant.PHONE_REQUIRED],
    trim: true
  },
  nickname: { 
    type: String, 
    trim: true, 
    required: [true, constant.NICKNAME_REQUIRED],
    maxlength: [24, constant.NICKNAME_MAXLEN_ERROR]
  },
  hash: { type: String, select: false },
  salt: { type: String, select: false },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  super: {
    type: Boolean,
    default: false
  },
  administrator: {
    type: Boolean,
    default: false
  }
})

module.exports = userSchema
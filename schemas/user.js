const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let userSchema = new Schema({
  username: { 
    type: String, 
    unique: true, 
    required: [true, constant.USERNAME_REQUIRED],
    trim: true, 
    maxlength: [24, constant.USERNAME_MAXLEN_ERROR]
  },
  email: { 
    type: String, 
    unique: true, 
    required: [true, constant.EMAIL_REQUIRED],
    trim: true
  },
  panname: { 
    type: String, 
    trim: true, 
    maxlength: [24, constant.USERNAME_MAXLEN_ERROR]
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
const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let verificationSchema = new Schema({
  phone: { 
    type: String, 
    unique: true, 
    required: [true, constant.PHONE_REQUIRED],
    trim: true
  },
  code: { 
    type: String, 
    trim: true, 
    required: [true, constant.CODE_REQUIRED],
  },
  createdAt: {
    type: Date,
    index: { expires : 600 },
    default: Date.now
  }
})

module.exports = verificationSchema
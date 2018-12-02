const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let columnSchema = new Schema({
  name: { 
    type: String, 
    required: [true, constant.USERNAME_REQUIRED], 
    trim: true
  },
  description: { 
    type: String, 
    required: [true, constant.USERNAME_REQUIRED],
    trim: true
  },
  created_date: { type: Date, default: Date.now },
})

module.exports = columnSchema
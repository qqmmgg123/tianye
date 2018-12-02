const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let classicSchema = new Schema({
  title: { 
    type: String, 
    required: [true, constant.USERNAME_REQUIRED], 
    trim: true
  },
  summary: { 
    type: String, 
    required: [true, constant.USERNAME_REQUIRED],
    trim: true
  },
  content: { 
    type: String, 
    required: [true, constant.USERNAME_REQUIRED]
  },
  poster: { 
    type: String, 
    required: [true, constant.USERNAME_REQUIRED], 
    default: constant.DEFAULT_IMAGE,
    trim: true
  },
  creator_id: Schema.Types.ObjectId,
  updated_date: { type: Date, default: Date.now },
  created_date: { type: Date, default: Date.now },
})

module.exports = classicSchema
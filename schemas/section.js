const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let sectionSchema = new Schema({
  title: { 
    type: String, 
    required: [true, constant.USERNAME_REQUIRED], 
    trim: true
  },
  summary: { 
    type: String, 
    trim: true
  },
  content: { 
    type: String
  },
  classic_id: { 
    type: Schema.Types.ObjectId,
    ref: 'Classic'
  },
  parent_id: Schema.Types.ObjectId,
  parent_type: String,
  updated_date: { type: Date, default: Date.now },
  created_date: { type: Date, default: Date.now },
})

module.exports = sectionSchema
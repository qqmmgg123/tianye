const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let sectionSchema = new Schema({
  title: { 
    type: String, 
    required: [true, constant.USERNAME_REQUIRED], 
    trim: true
  },
  content: { 
    type: String
  },
  classic_id: { 
    type: Schema.Types.ObjectId,
    ref: 'Classic',
  },
  audio: { 
    type: String, 
    trim: true
  },
  creator_id: Schema.Types.ObjectId,
  updated_date: { type: Date, default: Date.now },
  created_date: { type: Date, default: Date.now },
})

module.exports = sectionSchema
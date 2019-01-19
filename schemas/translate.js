const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let translateSchema = new Schema({
  title: { 
    type: String, 
    required: [true, constant.TRANSLATE_TITLE_REQUIRED], 
    trim: true
  },
  content: { 
    type: String, 
    required: [true, constant.TRANSLATE_CONTENT_REQUIRED]
  },
  section_id: Schema.Types.ObjectId,
  creator_id: Schema.Types.ObjectId,
  updated_date: { type: Date, default: Date.now },
  created_date: { type: Date, default: Date.now },
})

module.exports = translateSchema
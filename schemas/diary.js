const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let diarySchema = new Schema({
  content: { 
    type: String, 
    trim: true,
    required: [ 
      true,
      constant.NO_DIARY_CONTENT
    ]
  },
  creator_id: Schema.Types.ObjectId,
  created_date: { type: Date, default: Date.now },
})

module.exports = diarySchema
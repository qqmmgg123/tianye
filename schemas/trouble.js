const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let troubleSchema = new Schema({
  content: { 
    type: String, 
    required: [true, constant.NO_TROUBLE_CONTENT],
    trim: true
  },
  creator_id: Schema.Types.ObjectId,
  creator_temp_name: { 
    type: String, 
    trim: true, 
    maxlength: [24, constant.USERNAME_MAXLEN_ERROR]
  },
  created_date: { type: Date, default: Date.now },
  last_reply_date: {
    type: Date, default: Date.now
  }
})

module.exports = troubleSchema
const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let shareSchema = new Schema({
  content: { 
    type: String, 
    required: [true, constant.USERNAME_REQUIRED], 
    trim: true
  },
  title: { 
    type: String, 
    trim: true
  },
  creator_id: { 
    type: Schema.Types.ObjectId,
    required: [true, constant.USERNAME_REQUIRED],
  },
  column_id: { 
    type: String,
    required: [true, constant.USERNAME_REQUIRED],
  },
  creator_temp_name: { 
    type: String,
    trim: true, 
    maxlength: [24, constant.USERNAME_MAXLEN_ERROR],
  },
  updated_date: { 
    type: Date, default: Date.now 
  },
  created_date: { 
    type: Date, default: Date.now 
  },
  thank: {
    type: Number,
    default: 0
  },
})

module.exports = shareSchema
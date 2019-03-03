const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let mindSchema = new Schema({
  type_id: {
    type: String,
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  content: { 
    type: String, 
    required: [
      true, 
      constant.NO_CONTENT
    ],
    trim: true
  },
  title: { 
    type: String, 
    trim: true
  },
  summary: { 
    type: String, 
    maxlength: [ 
      150, 
      constant.OVER_MAX_SUMMARYLENGTH 
    ],
    trim: true
  },
  is_extract: {
    type: Boolean,
    default: false
  },
  ref_id: Schema.Types.ObjectId,
  // 创建者id
  creator_id: { 
    type: Schema.Types.ObjectId,
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  // 书写类型
  column_id: { 
    type: String,
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  // 最新的回复
  last_reply_id: { 
    type: Schema.Types.ObjectId
  },
  // 创建者临时名称
  creator_temp_name: { 
    type: String, 
    trim: true, 
    maxlength: [
      24, 
      constant.USERNAME_MAXLEN_ERROR
    ]
  },
  created_date: { 
    type: Date, 
    default: Date.now 
  },
  updated_date: { 
    type: Date
  },
  last_reply_date: {
    type: Date
  },
  state_change_date: {
    type: Date, 
    default: Date.now
  },
})

mindSchema.virtual('quote', {
  ref: 'Classic',
  localField: 'ref_id',
  foreignField: '_id'
})

mindSchema.virtual('new_reply', {
  ref: 'Reply',
  localField: 'last_reply_id',
  foreignField: '_id'
})

module.exports = mindSchema
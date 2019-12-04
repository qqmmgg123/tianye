const Schema = require('mongoose').Schema
, constant = require('../settings/const')
, maxlength = constant.SUMMARY_LIMIT - 3

let replySchema = new Schema({
  type: {
    type: String,
    enum: ['text', 'emotion'],
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  sub_type: {
    type: String,
    enum: ['text', 'understand', 'thank'],
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
    maxlength,
    trim: true
  },
  summary: { 
    type: String, 
    /* maxlength: [ 
      maxlength, 
      constant.OVER_MAX_SUMMARYLENGTH 
    ], */
    trim: true
  },
  reply_id: Schema.Types.ObjectId,
  reply_type: String,
  parent_id:{ 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  parent_type: String,
  // 引用id
  ref_id: Schema.Types.ObjectId,
  // 引用类型
  ref_type: {
    type: String,
    enum: ['mind', 'classic']
  },
  // 引用书写类型
  ref_column: {
    type: String,
    enum: ['sentence', 'article', 'works']
  },
  creator_id: { 
    type: Schema.Types.ObjectId, 
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  poster: { 
    type: String,
    trim: true
  },
  // 书写类型
  column_id: { 
    type: String,
    enum: ['sentence', 'article', 'works'],
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  // 公号
  party_id: {
    type: Schema.Types.ObjectId
  },
  receiver_id: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  receiver_pid: { 
    type: Schema.Types.ObjectId, 
  },
  created_date: { type: Date, default: Date.now },
})

module.exports = replySchema

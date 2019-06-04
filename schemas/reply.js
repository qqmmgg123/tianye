const Schema = require('mongoose').Schema
, constant = require('../settings/const')

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
  reply_id: Schema.Types.ObjectId,
  reply_type: String,
  parent_id:{ 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  parent_type: String,
  ref_id: Schema.Types.ObjectId,
  ref_type: String,
  creator_id: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  receiver_id: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  created_date: { type: Date, default: Date.now },
})

module.exports = replySchema

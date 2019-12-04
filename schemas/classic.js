const Schema = require('mongoose').Schema
, constant = require('../settings/const')
, maxlength = constant.SUMMARY_LIMIT - 3

let classicSchema = new Schema({
  title: { 
    type: String, 
    maxlength,
    trim: true
  },
  summary: { 
    type: String, 
    required: [true, constant.MISS_PARAMS],
    /* maxlength: [ 
      maxlength, 
      constant.OVER_MAX_SUMMARYLENGTH 
    ], */
    trim: true
  },
  original_author: {
    type: String, 
    required: [true, constant.MISS_PARAMS],
    trim: true
  },
  source: {
    type: String, 
    required: [true, constant.MISS_PARAMS],
    trim: true
  },
  content: { 
    type: String, 
    required: [true, constant.MISS_PARAMS],
    trim: true
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
  creator_id: Schema.Types.ObjectId,
  mind_id: Schema.Types.ObjectId,
  updated_date: { type: Date, default: Date.now },
  created_date: { type: Date, default: Date.now },
})

classicSchema.virtual('author', {
  ref: 'User',
  localField: 'creator_id',
  foreignField: '_id'
})

module.exports = classicSchema
const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let classicSchema = new Schema({
  title: { 
    type: String, 
    required: [true, constant.MISS_PARAMS], 
    trim: true
  },
  summary: { 
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
    required: [true, constant.MISS_PARAMS], 
    default: constant.DEFAULT_IMAGE,
    trim: true
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

classicSchema.virtual('mind', {
  ref: 'Mind',
  localField: 'mind_id',
  foreignField: '_id'
})

module.exports = classicSchema
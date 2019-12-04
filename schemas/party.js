const Schema = require('mongoose').Schema
, constant = require('../settings/const')

const partySchema = new Schema({
  // 公号名称
  name: {
    type: String,
    trim: true,
    required: [true, constant.PARTYNAME_REQUIRED],
    maxlength: 50
  },
  // 公号介绍
  intro: {
    type: String,
    trim: true,
    maxlength: 150
  },
  // 创建者id
  creator_id: { 
    type: Schema.Types.ObjectId,
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  }
}, {
  timestamps: true
})

module.exports = partySchema

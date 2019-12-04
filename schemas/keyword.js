const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let keywordSchema = new Schema({
  name: { 
    type: String, 
    required: [true, constant.MISS_PARAMS], 
    trim: true
  },
  mind_id: Schema.Types.ObjectId,
  creator_id: Schema.Types.ObjectId,
  visits: { 
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

keywordSchema.index({ name: 1, mind_id: 1 }, { unique: true });

module.exports = keywordSchema
const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let knowledgeSchema = new Schema({
  name: { 
    type: String, 
    required: [true, constant.MISS_PARAMS], 
    unique : true,
    dropDups: true,
    trim: true
  },
  creator_id: Schema.Types.ObjectId,
  content: { 
    type: String, 
    required: [
      true, 
      constant.NO_CONTENT
    ],
    trim: true
  },
}, {
  timestamps: true
})

module.exports = knowledgeSchema
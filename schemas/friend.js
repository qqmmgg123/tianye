const Schema = require('mongoose').Schema
const constant = require('../settings/const')

const friendSchema = new Schema({
  requester: { type: Schema.Types.ObjectId, ref: 'User'},
  recipient: { type: Schema.Types.ObjectId, ref: 'User'},
  status: {
    type: Number,
    enums: [
      0,    //'add friend',
      1,    //'requested'
      2,    //'pending',
      3,    //'accepted'
    ]
  },
  content: {
    type: String,
    trim: true,
    maxlength: [30, constant.CONTENT_MAXLEN_ERROR]
  },
  remark: {
    type: String,
    trim: true,
    maxlength: [24, constant.REMARK_MAXLEN_ERROR]
  }
}, {timestamps: true})

module.exports = friendSchema
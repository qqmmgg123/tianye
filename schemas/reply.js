let Schema = require('mongoose').Schema;

let replySchema = new Schema({
  content: { 
    type: String,
    required: true,
    trim: true 
  },
  reply_id: Schema.Types.ObjectId,
  reply_type: String,
  parent_id: Schema.Types.ObjectId,
  parent_type: String,
  ref_id: Schema.Types.ObjectId,
  creator_id: Schema.Types.ObjectId,
  receiver_id: Schema.Types.ObjectId,
  created_date: { type: Date, default: Date.now },
})

module.exports = replySchema
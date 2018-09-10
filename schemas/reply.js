let Schema = require('mongoose').Schema;

let replySchema = new Schema({
  content: String,
  reply_id: Schema.Types.ObjectId,
  reply_type: String,
  created_id: Schema.Types.ObjectId,
  create_date: { type: Date, default: Date.now },
})

module.exports = replySchema
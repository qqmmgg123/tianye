let Schema = require('mongoose').Schema;

let commentSchema = new Schema({
  content: String,
  comfort_id: Schema.Types.ObjectId,
  created_id: Schema.Types.ObjectId,
  create_date: { type: Date, default: Date.now },
})

module.exports = commentSchema
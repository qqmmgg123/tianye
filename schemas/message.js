let Schema = require('mongoose').Schema;

let messageSchema = new Schema({
  sender: Schema.Types.ObjectId,
  recipient: Schema.Types.ObjectId,
  content: String,
  feature: String,
  sub_feature: String,
  has_new: Boolean,
})

module.exports = messageSchema
let Schema = require('mongoose').Schema;

let messageSchema = new Schema({
  sender: Schema.Types.ObjectId,
  recipient: Schema.Types.ObjectId,
  content: String,
  feature: String,
  sub_feature: String,
  has_new: Boolean,
})

// messageSchema.index({recipient: 1, feature: 1, sub_feature: 1}, {unique: true});

module.exports = messageSchema
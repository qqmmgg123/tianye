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

replySchema.virtual('author', {
  ref: 'User',
  localField: 'creator_id',
  foreignField: '_id'
})

replySchema.virtual('friend', {
  ref: 'Friend',
  localField: 'creator_id',
  foreignField: 'recipient'
})

module.exports = replySchema
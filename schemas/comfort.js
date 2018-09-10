let Schema = require('mongoose').Schema;

let comfortSchema = new Schema({
  content: String,
  trouble_id: Schema.Types.ObjectId,
  created_id: Schema.Types.ObjectId,
  create_date: { type: Date, default: Date.now },
})

module.exports = comfortSchema
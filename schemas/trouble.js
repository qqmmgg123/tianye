let Schema = require('mongoose').Schema;

let troubleSchema = new Schema({
  content: String,
  created_id: Schema.Types.ObjectId,
  create_date: { type: Date, default: Date.now },
})

module.exports = troubleSchema
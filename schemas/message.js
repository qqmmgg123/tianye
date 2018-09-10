let Schema = require('mongoose').Schema;

let messageSchema = new Schema({
  content: String
})

module.exports = messageSchema
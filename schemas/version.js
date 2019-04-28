const Schema = require('mongoose').Schema

let versionSchema = new Schema({
  url: String,
  version_code: Number,
  update_message: String,
  type: String
}, {
  timestamps: true
})

module.exports = versionSchema
let mongoose = require('mongoose')
let Mind = require('../schemas/mind')
const constant = require('../settings/const')

Mind.statics.extract = function(content) {
  // let str  = this.content.replace(/(\r\n|\n|\r)/gm, '')
  // .replace(/\s+/g, '').replace(/[^\x20-\x7E]/gmi, '')
  return content.slice(0, constant.SUMMARY_LIMIT - 3) + '...'
}

Mind.pre('save', function (next, done) {
  if (this.column_id === 'literature' && !this.title) {
    throw new Error(constant.TITLE_REQUIRED)
  }
  this.is_extract = this.content.length > constant.SUMMARY_LIMIT - 3
  this.summary = this.is_extract
    ? this.constructor.extract(this.content)
    : this.content 
  next()
})

module.exports = mongoose.model('Mind', Mind)
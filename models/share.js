let mongoose = require('mongoose')
let Share = require('../schemas/share')
const constant = require('../settings/const')

Share.pre('validate', function(next) {
  if (this.column_id === 'literature' && !this.title) {
    throw new Error(constant.TITLE_REQUIRED)
  }
  next()
})

module.exports = mongoose.model('Share', Share)
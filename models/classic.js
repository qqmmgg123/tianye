const mongoose = require('mongoose')
, Classic = require('../schemas/classic')
, constant = require('../settings/const')

Classic.statics.extract = function(content) {
  return content.slice(0, constant.SUMMARY_LIMIT - 3) + '...'
}

module.exports = mongoose.model('Classic', Classic)
const mongoose = require('mongoose')
, Classic = require('../schemas/classic')
, constant = require('../settings/const')

Classic.statics.extract = function(content) {
  let str  = content && content
  .replace(/\<[^\<\>]+\>/gm, '')
  .replace(/(\s|\r|\n|\t)+/gm, '')
  .replace(/&[^&;]+;/gm, '') || ''
  , l = constant.SUMMARY_LIMIT - 3
  , is_extract = str.length > l
  return is_extract ? str.slice(0, l) + '...' : str
}

module.exports = mongoose.model('Classic', Classic)
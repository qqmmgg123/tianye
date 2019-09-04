let mongoose = require('mongoose')
let Keyword = require('../schemas/keyword')

module.exports = mongoose.model('Keyword', Keyword)
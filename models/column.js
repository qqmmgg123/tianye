let mongoose = require('mongoose')
let Column = require('../schemas/column')

module.exports = mongoose.model('Column', Column)
let mongoose = require('mongoose')
let Quote = require('../schemas/quote')

module.exports = mongoose.model('Quote', Quote)

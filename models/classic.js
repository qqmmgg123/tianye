let mongoose = require('mongoose')
let Classic = require('../schemas/classic')

module.exports = mongoose.model('Classic', Classic)
let mongoose = require('mongoose')
let Thank = require('../schemas/thank')

module.exports = mongoose.model('Thank', Thank)
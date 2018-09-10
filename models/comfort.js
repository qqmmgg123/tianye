let mongoose = require('mongoose')
let Comfort = require('../schemas/comfort')

module.exports = mongoose.model('Comfort', Comfort)
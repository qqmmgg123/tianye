let mongoose = require('mongoose')
let Translate = require('../schemas/translate')

module.exports = mongoose.model('Translate', Translate)
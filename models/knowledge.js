let mongoose = require('mongoose')
let Knowledge = require('../schemas/knowledge')

module.exports = mongoose.model('Knowledge', Knowledge)

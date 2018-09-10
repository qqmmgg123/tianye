let mongoose = require('mongoose')
let Trouble = require('../schemas/trouble')

module.exports = mongoose.model('Trouble', Trouble)
let mongoose = require('mongoose')
let Version = require('../schemas/version')

module.exports = mongoose.model('Version', Version)
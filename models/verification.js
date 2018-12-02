let mongoose = require('mongoose')
let Verification = require('../schemas/verification')

module.exports = mongoose.model('Verification', Verification)
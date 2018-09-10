let mongoose = require('mongoose')
let Message = require('../schemas/message')

module.exports = mongoose.model('Message', Message)
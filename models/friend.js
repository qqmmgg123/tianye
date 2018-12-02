let mongoose = require('mongoose')
let Friend = require('../schemas/friend')

module.exports = mongoose.model('Friend', Friend)
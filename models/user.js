let mongoose = require('mongoose')
let User = require('../schemas/user')

module.exports = mongoose.model('User', User)
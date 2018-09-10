let mongoose = require('mongoose')
let Reply = require('../schemas/reply')

module.exports = mongoose.model('Reply', Reply)
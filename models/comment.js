let mongoose = require('mongoose')
let Comment = require('../schemas/comment')

module.exports = mongoose.model('Comment', Comment)
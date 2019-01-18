let mongoose = require('mongoose')
let Section = require('../schemas/section')

module.exports = mongoose.model('Section', Section)
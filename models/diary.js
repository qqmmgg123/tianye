let mongoose = require('mongoose')
let Diary = require('../schemas/diary')

module.exports = mongoose.model('Diary', Diary)
let mongoose = require('mongoose')
let Name = require('../schemas/name')

module.exports = mongoose.model('Name', Name)
let mongoose = require('mongoose')
let OwnerTrouble = require('../schemas/owner_trouble')

module.exports = mongoose.model('OwnerTrouble', OwnerTrouble)
let mongoose = require('mongoose')
let FeatureVisitor = require('../schemas/feature_visitor')

module.exports = mongoose.model('FeatureVisitor', FeatureVisitor)
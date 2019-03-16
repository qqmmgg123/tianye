let mongoose = require('mongoose')
let Classic = require('../schemas/classic')

// 获取引用的经典
Classic.statics.quoteQuery = function() {
  return { $lookup: {
    from: this.collection.name,
    let: { 'quote_id': '$ref_id' },
    pipeline: [
      { $match: { 
        $expr: { $eq: [ '$_id', '$$quote_id' ] }
      }},
      { $project: {
        title: 1,
        summary: 1
      }},
    ],
    as: 'quote'
  }}
}

module.exports = mongoose.model('Classic', Classic)
let mongoose = require('mongoose')
let Party = require('../schemas/party')

// 获取公号信息
Party.statics.partyInfoQuery = function() {
  return { $lookup: {
    from: this.collection.name,
    let: { 'party_id': '$party_id' },
    pipeline: [
      { $match: { 
        $expr: { $eq: [ '$_id', '$$party_id' ] }
      }},
      { $project: {
        name: 1
      }},
    ],
    as: 'party'
  }}
}

module.exports = mongoose.model('Party', Party)
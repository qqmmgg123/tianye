let mongoose = require('mongoose')
let Visitor = require('../schemas/visitor')

Visitor.statics.queryVisitor = function(uid) {
  return { $lookup: {
    from: this.collection.name,
    let: { 'mind_id': '$_id' },
    pipeline: [
      { $match: {
        visitor_id: uid,
        $expr: { $eq: [ '$basis_id', '$$mind_id' ] }
      }},
      { $project: {
        visited_date: 1
      }},
    ],
    as: 'visitor'
  }}
}

module.exports = mongoose.model('Visitor', Visitor)
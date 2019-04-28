let mongoose = require('mongoose')
let Quote = require('../schemas/quote')
let Friend = require('../models/friend')

// 查询引用
Quote.statics.quoteQuery = function(uid) {
  return { $lookup: {
    from: this.collection.name,
    let: { 'quote_id': '$ref_id' },
    pipeline: [
      { $match: { 
        $expr: { $eq: [ '$_id', '$$quote_id' ] }
      }},
      { "$let" : {
        "vars" : { "mid" :  "$url" },
        "in" : ObjectId('$$mid') 
      } },
      { $lookup: {
        from: 'minds',
        let: { 'mind_id': '$$mid' },
        pipeline: [
          { $match: { 
            $expr: {
              $eq: [ '$_id', '$$mind_id' ] 
            }
          }},
          ...Friend.friendshipQuery(uid),
          { $project: {
            perm_id: 1,
            recipient: { $cond : [ { $eq : ['$recipient', []]}, [ null ], '$recipient'] },
            requester: { $cond : [ { $eq : ['$requester', []]}, [ null ], '$requester'] },
          }},
          { $unwind: '$recipient'},
          { $unwind: '$requester'},
          { $project: {
            perm_id: 1,
            is_friend: {
              $and: [
                { 
                  $eq: ['$recipient.status', 3] 
                }, { 
                  $eq: ['$requester.status', 3]
                }
              ]
            }
          }},
        ],
        as: 'mind'
      }},
      { $project: {
        title: 1,
        summary: 1,
        type: 1,
        url: 1,
        poster_url: 1,
        mind: '$mind'
      }},
    ],
    as: 'quote'
  }}
}

module.exports = mongoose.model('Quote', Quote)

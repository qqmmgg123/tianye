let mongoose = require('mongoose')
, Mind = require('../schemas/mind')
const constant = require('../settings/const')
, Friend = require('../models/friend')


Mind.statics.extract = function(content) {
  // let str  = this.content.replace(/(\r\n|\n|\r)/gm, '')
  // .replace(/\s+/g, '').replace(/[^\x20-\x7E]/gmi, '')
  return content.slice(0, constant.SUMMARY_LIMIT - 3) + '...'
}

// 查询引用
Mind.statics.quoteQuery = function(uid) {
  let condition = [
    { $match: { 
      $expr: {
        $eq: [ '$_id', '$$mind_id' ] 
      }
    }},
  ]
  , project = { $project: {
    _id: 1,
    title: 1,
    summary: 1,
    type: '$$type',
    url: '$_id',
    perm_id: 1
  }}

  if (uid) {
    condition.push(
      ...Friend.friendshipQuery(uid),
      {$project: Object.assign({}, project.$project, {
        creator_id: 1,
        recipient: { $cond : [ { $eq : ['$recipient', []]}, [ null ], '$recipient'] },
        requester: { $cond : [ { $eq : ['$requester', []]}, [ null ], '$requester'] },
      })},
      { $unwind: '$recipient'},
      { $unwind: '$requester'},
      {$project: Object.assign({}, project.$project, {
        type: 1,
        url: 1,
        is_friend: {
          $or: [
            {$and: [
              { 
                $eq: ['$recipient.status', 3] 
              }, { 
                $eq: ['$requester.status', 3]
              }
            ]},
            { 
              $eq: ['$creator_id', uid] 
            }
          ]
        }
      })}
    )
  } else {
    condition.push({$project: Object.assign(project.$project, {
      is_friend: { $not: true }
    })})
  }

  return [
    { $lookup: {
      from: this.collection.name,
      let: { 
        'mind_id': '$ref_id',  
        'type': '$ref_type'
      },
      pipeline: condition,
      as: 'quote'
    }}
  ]
}

Mind.pre('save', function (next, done) {
  if (this.column_id === 'literature' && !this.title) {
    throw new Error(constant.TITLE_REQUIRED)
  }
  this.is_extract = this.content.length > constant.SUMMARY_LIMIT - 3
  this.summary = this.is_extract
    ? this.constructor.extract(this.content)
    : this.content 
  next()
})

module.exports = mongoose.model('Mind', Mind)

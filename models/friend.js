let mongoose = require('mongoose')
let Friend = require('../schemas/friend')

// 获取有缘人关系
Friend.statics.friendshipQuery = (uid) => {
  return [{ $lookup: {
    from: Friend.collection.name,
    let: { 'creator_id': '$creator_id' },
    pipeline: [{ 
      $match: { 
        recipient: uid,
        $expr: { $eq: [ '$requester', '$$creator_id' ] }
      }
    }],
    as: 'requester'
  }},
  { $lookup: {
    from: Friend.collection.name,
    let: { 'creator_id': '$creator_id' },
    pipeline: [{ 
      $match: { 
        requester: uid,
        $expr: { $eq: [ '$recipient", "$$creator_id' ] }
      }
    }],
    as: 'recipient'
  }}]
}

// 匹配是否为有缘人关系
Friend.statics.friendshipMatch = () => {
  return { 
    $match: {  
      $expr: {
        $and: [
          { 
            $eq: ['$recipient.status', 3] 
          }, { 
            $eq: ['$requester.status', 3]
          }, {
            $or: [
              {
                $and: [
                  { $eq: ['$recipient.shareHelp', true] },
                  { '$eq': ['$type_id', 'help'] },
                ]
              }, {
                $and: [
                  { $eq: ['$recipient.shareShare', true] },
                  { $eq: ['$type_id', 'share'] },
                ]
              }
            ]
          }
        ]
      }
    }
  }
}

// 获取有缘人数目
Friend.statics.getFriendTotal = async (uid) => {
  let friends = await Friend.aggregate(
    [
      { $lookup: {
        from: Friend.collection.name,
        let: { 'recipient': '$recipient' },
        pipeline: [
          { $match: { 
            recipient: uid,
            $expr: { $eq: [ '$requester', '$$recipient' ] }
          }},
        ],
        as: 'friend'
      }},
      { $unwind: '$friend' },
      { $match: {
        requester: uid,
        status: 3,
        $expr: {
          $and: [{ 
            $eq: ['$friend.status', 3] 
          }, { 
            $eq: ['$friend.requester', '$recipient'] 
          }]
        }
      }},
      { $count: 'total' }
    ]
  )
  return friends 
    && friends[0] 
    && friends[0].total 
    || 0
}

module.exports = mongoose.model('Friend', Friend)
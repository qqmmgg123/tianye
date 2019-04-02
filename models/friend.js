let mongoose = require('mongoose')
let Friend = require('../schemas/friend')

Friend.statics.requesterQuery = function(uid) {
  return { $lookup: {
    from: this.collection.name,
    let: { 'user_id': '$creator_id' },
    pipeline: [
      { $match: { 
        requester: uid,
        $expr: { $eq: [ '$recipient', '$$user_id' ] }
      }},
      { $project: {
        remark: 1
      }},
    ],
    as: 'friend'
  }}
}

// 获取有缘人关系
Friend.statics.friendshipQuery = function(uid) {
  return [{ $lookup: {
    from: this.collection.name,
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
    from: this.collection.name,
    let: { 'creator_id': '$creator_id' },
    pipeline: [{ 
      $match: { 
        requester: uid,
        $expr: { $eq: [ '$recipient', '$$creator_id' ] }
      }
    }],
    as: 'recipient'
  }}]
}

// 心事匹配是否为有缘人关系
Friend.statics.friendshipMatch = function() {
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
                  { $eq: ['$type_id', 'help'] },
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

// 心事回复匹配是否为有缘人关系
Friend.statics.replyfriendshipMatch = function(uid) {
  return { 
    $match: { 
      $expr: { 
        $and: [
          { 
            $eq: [ 
              '$parent_id', 
              '$$mind_id' 
            ]
          }, { 
            $or: [
              { 
                $and: [
                  { 
                    $eq: [{ $min: '$recipient.status' }, 3]
                  }, { 
                    $eq: [{ $min:'$requester.status' }, 3] 
                  }
                ]
              }, { 
                $eq: ['$creator_id', uid]
              }
            ]
          },
        ]
      }
    }
  }
}

// 获取有缘人数目
Friend.statics.getFriendTotal = async function(uid) {
  let friends = await this.aggregate(
    [
      { $lookup: {
        from: this.collection.name,
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

// 最新回复匹配是否是针对当前用户的心事
Friend.statics.lastReplyMatch = function(uid) {
  return { 
    $match: { 
      $expr: { 
        $and: [
          {
            $eq: [ '$parent_id', '$$mind_id' ]
          }, {
            $ne: [ '$creator_id', uid ]
          }, 
        ],
      }
    }
  }
}

// 最新针对当前用户心事回复匹配是否为有缘人关系
Friend.statics.newReplyfriendshipMatch = function(uid) {
  return { 
    $match: { 
      $expr: { 
        $and: [
          { 
            $eq: [ '$parent_id', '$$mind_id' ]
          }, {
            $eq: [ '$receiver_id', uid ]
          }, { 
            $and: [
              { 
                $eq: [{ $min: '$recipient.status' }, 3]
              }, { 
                $eq: [{ $min:'$requester.status' }, 3] 
              }
            ]
          },
        ]
      }
    }
  }
}

// 最新心事回复匹配是否为有缘人关系
Friend.statics.lastReplyfriendshipMatch = function(uid) {
  return { 
    $match: { 
      $expr: { 
        $and: [
          { 
            $eq: [ '$parent_id', '$$mind_id' ]
          }, { 
            $and: [
              { 
                $eq: [{ $min: '$recipient.status' }, 3]
              }, { 
                $eq: [{ $min:'$requester.status' }, 3] 
              }
            ]
          },
        ]
      }
    }
  }
}

module.exports = mongoose.model('Friend', Friend)
let mongoose = require('mongoose')
let Friend = require('../schemas/friend')

Friend.statics.requesterQuery = function(uid, name = 'creator_id') {
  return { $lookup: {
    from: this.collection.name,
    let: { 'user_id': '$' + name },
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

Friend.statics.receiverRequesterQuery = function(uid) {
  return { $lookup: {
    from: this.collection.name,
    let: { 'user_id': '$receiver_id' },
    pipeline: [
      { $match: { 
        requester: uid,
        $expr: { $eq: [ '$recipient', '$$user_id' ] }
      }},
      { $project: {
        remark: 1
      }},
    ],
    as: 'friend_receiver'
  }}
}

// 获取知己关系
Friend.statics.friendshipQuery = function(uid, name = 'creator_id') {
  if (uid) {
    return [{ $lookup: {
      from: this.collection.name,
      let: { 'user_id': '$' + name },
      pipeline: [{ 
        $match: { 
          recipient: uid,
          $expr: { $eq: [ '$requester', '$$user_id' ] }
        }
      }],
      as: 'requester'
    }},
    { $lookup: {
      from: this.collection.name,
      let: { 'user_id': '$' + name },
      pipeline: [{ 
        $match: { 
          requester: uid,
          $expr: { $eq: [ '$recipient', '$$user_id' ] }
        }
      }],
      as: 'recipient'
    }}]
  } else {
    return []
  }
}

// 心事匹配没有请求过好友的
Friend.statics.neReqfriendMatch = function() {
  return {
    $match: { 
      $expr: {
        $and: [
          {
            $eq: [{
              $ifNull: [{ 
                $min: '$requester.status' 
              }, 0]
            }, 0] 
          }, {
            $eq: [{
              $ifNull: [{ 
                $min: '$recipient.status' 
              }, 0]
            }, 0] 
          }, 
        ]
      }, 
    }
  }
}

// 心事匹配是否为知己关系
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

// 心事匹配是否为非知己关系
Friend.statics.neFriendshipMatch = function(uid) {
  let match = {
    $and: [
      { $eq: ['$perm_id', 'all'] },
      { $or: [
        {
          $and: [
            { $eq: ['$type_id', 'help'] },
          ]
        }, {
          $and: [
            { $eq: ['$type_id', 'share'] },
          ]
        }
      ] }
    ]
  }

  if (!uid) {
    return { 
      $match: {  
        $expr: match
      }
    }
  } else {
    match.$and = match.$and.concat([{
      $ne: ['$recipient.status', 3]
    }, { 
      $ne: ['$requester.status', 3]
    }, {
      $ne: ['$creator_id', uid]
    }])
    return { 
      $match: {  
        $expr: match
      }
    }
  }
}

// 心事回复匹配是否为知己关系
Friend.statics.replyfriendshipMatch = function(uid, mindId) {
  return { 
    $match: { 
      $expr: { 
        $and: [
          { 
            $eq: [ 
              '$parent_id', 
              mindId ? mindId : '$$mind_id'
            ]
          }, { 
            $or: [
              { 
                $and: [
                  { 
                    $eq: ['$recipient.status', 3]
                  }, { 
                    $eq: ['$requester.status', 3] 
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

// 获取知己数目
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

// 最新针对当前用户心事回复匹配是否为知己关系
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

// 最新心事回复匹配是否为知己关系
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
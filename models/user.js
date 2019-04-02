let mongoose = require('mongoose')
let User = require('../schemas/user')

// 获取有缘人关系
User.statics.authorInfoQuery = function() {
  return { $lookup: {
    from: this.collection.name,
    let: { 'user_id': '$creator_id' },
    pipeline: [
      { $match: { 
        $expr: { $eq: [ '$_id', '$$user_id' ] }
      }},
      { $project: {
        panname: 1,
        username: 1,
      }},
    ],
    as: 'author'
  }}
}

module.exports = mongoose.model('User', User)

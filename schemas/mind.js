const Schema = require('mongoose').Schema
const constant = require('../settings/const')

let mindSchema = new Schema({
  // 以组织或以个人名义
  behalf: {
    type: String,
    enum: ['personal', 'organization'],
    required: [
      true, 
      constant.MISS_PARAMS
    ],
    default: 'personal'
  },
  type_id: {
    type: String,
    enum: ['diary', 'help', 'share'],
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  content: { 
    type: String, 
    required: [
      true, 
      constant.NO_CONTENT
    ],
    trim: true
  },
  title: { 
    type: String, 
    trim: true
  },
  summary: { 
    type: String, 
    maxlength: [ 
      150, 
      constant.OVER_MAX_SUMMARYLENGTH 
    ],
    trim: true
  },
  is_extract: {
    type: Boolean,
    default: false
  },
  // 引用id
  ref_id: Schema.Types.ObjectId,
  // 引用类型
  ref_type: {
    type: String,
    enum: ['mind', 'classic'],
    trim: true
  },
  // 创建者id
  creator_id: { 
    type: Schema.Types.ObjectId,
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  // 书写类型
  column_id: { 
    type: String,
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  // 查看权限类型
  // TODO 可以发到指定的组织
  perm_id: {
    type: String,
    enum: ['me', 'friend', 'all'],
    required: [
      true, 
      constant.MISS_PARAMS
    ],
  },
  // 最新的回复
  last_reply_id: { 
    type: Schema.Types.ObjectId
  },
  created_date: { 
    type: Date, 
    default: Date.now 
  },
  updated_date: { 
    type: Date
  },
  last_reply_date: {
    type: Date
  },
  state_change_date: {
    type: Date, 
    default: Date.now
  },
})

mindSchema.pre('validate', async function() {
  this.title && (this.title = this.title.replace(/\r|\n|\t/gi, ''))
  if (!this.perm_id) {
    switch (this.type_id) {
      case 'diary':
        this.perm_id = 'me'
        break
      case 'help':
        this.perm_id = 'friend'
        break
      case 'share':
        this.perm_id = 'all'
        break
    }
  }
})

module.exports = mindSchema

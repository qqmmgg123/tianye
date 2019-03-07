const constant = {
  APP_NAME: '田野',
  APP_SLOGAN: '耕耘内心',

  // 表单提示语
  DIARY_HOLDER: '记录点滴心语...',
  TROUBLE_HOLDER: '向有缘人诉说您内心的纠结...',
  SHARE_COLUMN_HOLDER: '请选择你创作的书写类型',
  SHARE_HOLDER: '内容...',
  REPLY_HOLDER: '回复',
  USERNAME_HOLDER: '用户名',
  PASSWORD_HOLDER: '密码',
  EMAIL_HOLDER: '邮箱',

  // 表单错误
  MISS_PARAMS: '缺少参数 :(',
  NO_CONTENT: '正文没有内容 :(',
  TITLE_REQUIRED: '标题没有写 :(',
  USER_EXISTS: '该用户已经存在 :(',
  USER_NOT_EXISTS: '该用户不存在 :(',
  USERNAME_ERROR: '用户名不存在 :(',
  USERNAME_REQUIRED: '用户名用来识别和保存你的内容，请不要留空 :(',
  PANNAME_CAN_NOT_EMPTY: '抱歉，请给自己取一个的对外的笔名',
  EMAIL_REQUIRED: '邮箱用于验证当前是否为您本人操作，请不要留空 :(',
  OVER_MAX_SUMMARYLENGTH: '摘要不能超出150个字符',
  EMAIL_EXISTS: '该邮箱已经被使用 :(',
  USERNAME_MAXLEN_ERROR: '用户名称最多24个字 :(',
  CONTENT_MAXLEN_ERROR: '内容最多30个字 :(',
  REMARK_MAXLEN_ERROR: '备注最多24个字 :(',
  PASSWORD_ERROR: '密码错误 :(',
  CODE_REQUIRED: '验证码没有输入 :(',
  VCODE_ERROR: '验证码错误 :(',
  SECTION_CLASSIC_NOT_EXIST: '您要添加章节的典籍不存在。',
  TRANSLATE_TITLE_REQUIRED: '翻译标题需要填写', 
  TRANSLATE_CONTENT_REQUIRED: '翻译内容需要填写', 
  TRANSLATE_SECTION_NOT_EXIST: '您要翻译的章节不存在。',

  // 列表加载提示语
  OTHER_FRIEND_REQUESTING: '您已经发起了将对方添加为{{FRIEND_NAME}}的申请',
  NO_MIND: '您当前内心很清净 : )',
  NO_CLASSICS: '当前没有内容。',
  NO_USER_RESULT: '抱歉，未找到该用户~',
  NO_TRANSLATE: '当前章节没有译文。',

  // 操作提示
  FRIEND_EXISTS: '对方已经是你{{FRIEND_NAME}}了',
  FRIEND_CANNOT_MINESELF: '不能添加自己为{{FRIEND_NAME}}',
  MINE_FRIEND_REQUESTING: '对方正在申请您为{{FRIEND_NAME}}',
  OTHER_FRIEND_NOT_REQUESTING: '对方并没有向您发出添加为{{FRIEND_NAME}}的申请',

  PANNAME_SET_TIPS: '为保护您的个人信息，对外发布内容，请设置一个可以公开的笔名。',

  FRIEND_NAME: '有缘人',
  ANONYMOUS_NAME: '匿名',

  // 列表分页
  LIST_LIMIT: 10,
  PAGE_RANGE: 10,

  // 功能
  FEATURES: {
    MIND: '心',
    KARMA: '缘',
    CLASSIC: '知',// '著作经典',
  },

  // 心念类型
  MIND_TYPE: {
    DIARY: {
      name: '心语',
      id: 'diary'
    },
    HELP: {
      name: '心结',
      id: 'help'
    },
    SHARE: {
      name: '心得',
      id: 'share'
    }
  },

  // 慈悲类型
  KARMA_TYPE: {
    THANK: {
      name: '受益',
      id: 'thank'
    },
    UNDERSTAND: {
      name: '理解',
      id: 'understand'
    },
  },

  // 书写类型
  COLUMNS: {
    SENTENCE: {
      name: '句子',// '鸡汤句子',
      id: 'sentence'
    },
    LITERATURE: {
      name: '文章',// '散文诗歌',
      id: 'literature'
    },
  },

  // 错误
  AUTHENTICATION_FAILURE_ERR: '需要用户登录.',

  // 默认图片
  DEFAULT_IMAGE: 'https://dns3.cinehello.com/1529484315_store_PD_BbR2cfWN.png',
  SUMMARY_LIMIT: 150,
}

// 输出模块
module.exports = JSON.parse((function (tpl, data) {
  return tpl.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, function(){
    var keys = arguments[1].split('.');
    var newData = data;
    for (var k = 0,l=keys.length;k < l;++k)
    newData = newData[keys[k]]
    return newData;
  })
})(JSON.stringify(constant), constant))

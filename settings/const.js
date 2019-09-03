const constant = {
  APP_NAME: '田野耘心',
  APP_SLOGAN: '给心灵一点空间',
  ICP_CODE: '赣ICP备19004410号-1',
  SITE_KEWWORDS: '田野耘心,内心,修行,禅',

  // 页面title
  SITE_SIGNIN_PAGE: '登录',
  SITE_SIGNUP_PAGE: '注册',
  SITE_ABOUT_PAGE: '关于我们',

  // 表单提示语
  DIARY_HOLDER: '记录点滴心语...',
  HELP_HOLDER: '向知己诉说您内心的纠结...',
  SHARE_COLUMN_HOLDER: '请选择你创作的书写类型',
  SHARE_HOLDER: '分享感悟，忠告，或抚慰心灵的鸡汤。',
  REPLY_HOLDER: '回复',
  USERNAME_HOLDER: '用户名',
  NICKNAME_HOLDER: '称号',
  PASSWORD_HOLDER: '密码',
  EMAIL_HOLDER: '邮箱',
  PHONE_HOLDER: '手机号',

  // 表单错误
  MISS_PARAMS: '缺少参数 :(',
  NO_CONTENT: '正文没有内容 :(',
  TITLE_REQUIRED: '标题需要填写:(',
  USER_EXISTS: '该用户已经存在 :(',
  USER_NOT_EXISTS: '该用户不存在 :(',
  NICKNAME_REQUIRED: '称号请不要留空 :(',
  NICKNAME_CAN_NOT_EMPTY: '抱歉，请给自己一个的称号',
  PHONE_REQUIRED: '手机号请不要留空 :(',
  PHONE_EXISTS: '该手机已经被使用 :(',
  EMAIL_REQUIRED: '邮箱请不要留空 :(',
  EMAIL_EXISTS: '该邮箱已经被使用 :(',
  MISSING_PASSWORD_ERROR: '密码请不要留空 :(',
  OVER_MAX_SUMMARYLENGTH: '摘要不能超出150个字符',
  USERNAME_MAXLEN_ERROR: '用户名称最多24个字 :(',
  NICKNAME_MAXLEN_ERROR: '称号最多24个字 :(',
  CONTENT_MAXLEN_ERROR: '内容最多30个字 :(',
  REMARK_MAXLEN_ERROR: '备注最多24个字 :(',
  PASSWORD_ERROR: '密码错误 :(',
  PASSWORD_DIFFERENT_ERROR: '两次输入密码不一致。',
  PASSWORD_SAME_ERROR: '新密码和旧密码一样的。',
  INCORRECT_OLD_PASSWORD_ERROR: '原密码错误 :(',
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

  NICKNAME_SET_TIPS: '为保护您的个人信息，对外发布内容，请设置一个可以公开的笔名。',

  FRIEND_NAME: '知己',
  ANONYMOUS_NAME: '匿名',

  // 列表分页
  LIST_LIMIT: 10,
  PAGE_RANGE: 10,

  // 功能
  FEATURES: {
    MIND: '心',
    KARMA: '缘',
    EARTH: '尘',
  },

  // 心念类型
  MIND_TYPE: {
    DIARY: {
      name: '心事',
      id: 'diary'
    },
    HELP: {
      name: '烦恼',
      id: 'help'
    },
    SHARE: {
      name: '感悟',
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
    ARTICLE: {
      name: '文章',// '散文诗歌',
      id: 'article'
    },
    WORKS: {
      name: '文章',// '散文诗歌',
      id: 'works'
    },
  },

  // 错误
  AUTHENTICATION_FAILURE_ERR: '需要用户登录.',

  // 默认图片
  DEFAULT_IMAGE: 'https://tianyeapp.top/static/images/logo_tianye.png',
  SUMMARY_LIMIT: 150,

  // 区号
  AREA_CODE: {
    CN: '86',
    TW: '886',
    HK: '852',
    MO: '853',
    JP: '81',
    KR: '82',
    SG:  '65',
    TH: '66',
    MY: '60',
    US: '1',
    CA: '1',
    AU: '61',
    GB: '44',
    DE: '49',
    FR: '33',
    RU: '7',
    IN: '91',
    NZ: '64',
    IT: '39',
    NL: '31',
    ES: '34',
    SE: '46',
    AT: '43',
    CH: '41',
    LT: '370',
    PH: '63',
    ID: '62',
    VN: '84',
    AE: '971',
  }
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

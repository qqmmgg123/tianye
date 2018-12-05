const constant = {
  APP_NAME: '田野',
  APP_SLOGAN: '回归清净，重拾初心',
  APP_HOME_PAGE: '首页',
  APP_SIGNIN_PAGE: '登录',
  APP_MINE_PAGE: '我的烦恼',
  APP_MINE_COMFORT_PAGE: '我熬的鸡汤',
  APP_COMFORT_PAGE: '鸡汤',
  APP_COMMENT_PAGE: '评论',
  APP_REPLY_PAGE: '回复',

  // 表单提示语
  DIARY_HOLDER: '记录点滴心语...',
  TROUBLE_HOLDER: '诉出您的忧扰...',
  SHARE_COLUMN_HOLDER: '请选择你创作的书写类型',
  SHARE_HOLDER: '内容...',
  COMFORT_HOLDER: '分享一点鸡汤',
  COMMENT_HOLDER: '说说你的看法',
  REPLY_HOLDER: '回复',
  USERNAME_HOLDER: '用户名',
  PASSWORD_HOLDER: '密码',
  EMAIL_HOLDER: '邮箱',

  // 表单错误
  NO_TROUBLE_CONTENT: '您发的内容是空的 :(',
  NO_DIARY_CONTENT: '您发的内容是空的 :(',
  TITLE_REQUIRED: '标题是空的 :(',
  USER_EXISTS: '该用户已经存在 :(',
  USER_NOT_EXISTS: '该用户不存在 :(',
  USERNAME_ERROR: '用户名不存在 :(',
  USERNAME_REQUIRED: '用户名用来识别和保存你的内容，请不要留空 :(',
  EMAIL_REQUIRED: '邮箱用于验证当前是否为您本人操作，请不要留空 :(',
  EMAIL_EXISTS: '该邮箱已经被使用 :(',
  USERNAME_MAXLEN_ERROR: '用户名最多24个字 :(',
  CONTENT_MAXLEN_ERROR: '内容最多30个字 :(',
  REMARK_MAXLEN_ERROR: '备注最多24个字 :(',
  PASSWORD_ERROR: '密码错误 :(',
  CODE_REQUIRED: '验证码没有输入 :(',
  VCODE_ERROR: '验证码错误 :(',

  // 列表加载提示语
  NO_MINE_TROUBLE: '当前没有内容。',
  NO_MINE_COMFORT: '期待您给我们熬制不一样的鸡汤',
  OTHER_FRIEND_REQUESTING: '您已经发起了将对方添加为{{FRIEND_NAME}}的申请',
  NO_DIARYS: '当前没有内容。',
  NO_CLASSICS: '当前没有内容。',
  NO_USER_RESULT: '抱歉，未找到该用户~',

  // 操作提示
  FRIEND_EXISTS: '对方已经是你{{FRIEND_NAME}}了',
  FRIEND_CANNOT_MINESELF: '不能添加自己为{{FRIEND_NAME}}',
  MINE_FRIEND_REQUESTING: '对方正在申请您为{{FRIEND_NAME}}',
  OTHER_FRIEND_NOT_REQUESTING: '对方并没有向您发出添加为{{FRIEND_NAME}}的申请',

  PANNAME_SET_TIPS: '为保护您的个人信息，对外发布内容，请设置一个可以公开的笔名。',

  FRIEND_NAME: '知己',
  ANONYMOUS_NAME: '匿名',

  // 列表分页
  LIST_LIMIT: 10,
  PAGE_RANGE: 10,

  // 功能
  FEATURES: {
    DIARY: '心情杂记',
    HELP: '排忧解难',
    SHARE: '心得感悟', // '原创分享',
    CLASSIC: '著作经典',
  },

  // 版块
  COLUMNS: {
    SENTENCE: {
      name: '鸡汤句子',
      id: 'sentence'
    },
    LITERATURE: {
      name: '散文诗歌',
      id: 'literature'
    },
    /* NATURAL: {
      name: '古朴原生态',
      id: 'natural'
    },
    GIVING: {
      name: '日行一善',
      id: 'giving'
    }, */
  },

  // 错误
  AUTHENTICATION_FAILURE_ERR: '需要用户登录.',

  // 默认图片
  DEFAULT_IMAGE: 'https://dns3.cinehello.com/1529484315_store_PD_BbR2cfWN.png',
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

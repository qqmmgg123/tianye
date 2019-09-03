if (module.hot) {
  module.hot.accept();
}

import '@/js/common/global'
import '@/sass/common/global.scss'
import '@/sass/mind.scss'

if (globalData.is_wechat) {
  let { configWx } = require('./component/wechat')
  , { mind } = globalData
  configWx({
    share_title: mind.titie || mind.summary,
    share_subtitle: mind.summary
  })
}
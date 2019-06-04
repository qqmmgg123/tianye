window.onerror = function(err) {
  alert(err.message)
}

if (globalData.is_wechat) {
  let { configWx } = require('./component/wechat')
  , { mind } = globalData
  configWx({
    share_title: mind.titie || mind.summary,
    share_subtitle: mind.summary
  })
}
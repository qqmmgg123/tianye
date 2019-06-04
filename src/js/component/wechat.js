
const imgUrl = 'https://www.tianyeapp.top/static/images/logo_tianye.png'
, wxData = globalData.signatureMap

module.exports =  {
  configWx: function(introData) {
    // alert(JSON.stringify(wxData))
    wx.config({
      debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
      appId: wxData.appid, // 必填，公众号的唯一标识
      timestamp: wxData.timestamp, // 必填，生成签名的时间戳
      nonceStr: wxData.noncestr, // 必填，生成签名的随机串
      signature: wxData.signature,// 必填，签名
      jsApiList: ['onMenuShareTimeline','onMenuShareAppMessage'] // 必填，需要使用的JS接口列表
    });
    wx.ready(function () {   //需在用户可能点击分享按钮前就先调用
      alert('wxready')
      // 微信老版本
      wx.onMenuShareAppMessage({
        title: introData.share_title, // 分享标题
        desc: introData.share_subtitle, // 分享描述
        link: wxData.url, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        imgUrl,
        success: function () {
          // 用户点击了分享后执行的回调函数
          alert('用户点击了分享后执行的回调函数')
        },
        cancel: function () {
          alert("失败")
        }
      });
      // 微信老版本
      wx.onMenuShareTimeline({
        title: introData.share_title, // 分享标题
        link: wxData.url, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        imgUrl,
        success: function () {
          // 用户点击了分享后执行的回调函数
          alert('用户点击了分享后执行的回调函数')
        },
        cancel: function () {
          alert("失败")
        }
      });
    });
  }
}
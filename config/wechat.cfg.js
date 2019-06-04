const createNonceStr = function() {
  return Math.random().toString(36).substr(2, 15);
}

// timestamp
const createTimeStamp = function () {
  return parseInt(new Date().getTime() / 1000) + '';
}

module.exports = {
  grant_type: 'client_credential',
  appid: 'wx6a2ad0b24115e40c',
  secret: '3f3dc7187ef147f157a986059137f81e',// '7b7d0b8714232b1f94562eb955fc7d39',// 'e49ac0690b959a6307b317fa04672f40',
  noncestr: createNonceStr(),
  accessTokenUrl:'https://api.weixin.qq.com/cgi-bin/token',
  ticketUrl: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
  cache_duration: 1000*60*60*24 // 缓存时长为24小时
}

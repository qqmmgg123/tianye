const crypto = require('crypto')
, semver = require('semver')
, fs = require('fs')

module.exports = {
  readData: function(path){
    return new Promise(function(resolve,reject){
      fs.readFile(path,function(err,data){
        if(err){
          reject(err)
        }else{
          resolve(data)
        }
      })
    })
    .then(function(data){
      return data;
    },function(err){
      return err
    })
  },
  pbkdf2: function(password, salt) {
    return new Promise((resolve, reject) => {
      const pbkdf2DigestSupport = semver.gte(process.version, '0.12.0');
      const iterations         = 25000
      const keylen             = 512
      const digestAlgorithm    = 'sha256'

      if (pbkdf2DigestSupport) {
        crypto.pbkdf2(password, salt, iterations, keylen, digestAlgorithm, (err, hash) => {
          if (err) {
            reject(err)
          } else {
            resolve(hash)
          }
        })
      } else {
        crypto.pbkdf2(password, salt, iterations, keylen, (err, hash) => {
          if (err) {
            reject(err)
          } else {
            resolve(hash)
          }
        })
      }
    })
  },
  pageRange: function(start, end) { 
    return [...Array(1+end-start).keys()].map(v => start+v)
  },
  filterMsg: function(message) {
    let msg = message.split(':')
    return msg 
    && msg.length 
    >  2
    ?  msg[2] 
    :  ''
  },
  /**
   * 时间格式化
   * 
   * @param  {date}   date      传人时间
   * @param  {boolean} normalization 是否需要标准时间格式
   * @return {string}           返回格式化的时间
   */
  getDate: function (date, normalization) {
    var invalidDate = '无效的时间';

    // check date valid
    if (Object.prototype.toString.call(date) === "[object Date]") {
      if (isNaN(date.getTime())) {
        return invalidDate;
      }
    } else {
      return invalidDate;
    }

    var offset = date.getTimezoneOffset() / 60;
    var reg = /^((\d{4})-(\d{2})-(\d{2}))T((\d{2}):(\d{2})):[^:]*$/;
    var els = reg.exec(date.toISOString());

    if (els) {
      var now = new Date();
      var isoNowEls = reg.exec(now.toISOString());
      var today = new Date([isoNowEls[1].replace(/-/g, '/'), isoNowEls[5].replace(/\d/g, '0')].join(' '));
      var times = now.getTime() - date.getTime();
      if (times < 0) {
        console('错误，历史时间大于当前时间');
        return invalidDate;
      }

      // 当天
      times = today.getTime() - date.getTime();
      var timeStr = [(+els[6] - offset) % 24, +els[7]].join(':').replace(/^(\d{1})\:/, '0$1:').replace(/\:(\d{1})$/, ':0$1');
      if (times <= 0) {
        return timeStr;
      }

      var days = times / (24 * 60 * 60 * 1000);
      if (days <= 1) {
        return ['昨天', timeStr].join(' ');
      } else if (days <= 2) {
        return ['前天', timeStr].join(' ');
      } else if (days <= 7) {
        return Math.floor(days) + '\u5929\u524D';
      }
      var dateStr = +els[3] + '\u6708' + +els[4] + '\u65E5';
      if (isoNowEls[2] - els[2] === 0) {
        return dateStr;
      }
      if (normalization === true) {
        return [+els[2] + '\u5E74' + dateStr, timeStr].join(' ');
      }
      return [els[1].split('-').map(function (i) {
        return +i;
      }).join('/'), timeStr].join(' ');
    } else {
      console.log('时间格式错误');
      return invalidDate;
    }
  }
}

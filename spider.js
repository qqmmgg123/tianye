require('dotenv').config()
const http   = require('http')
,     cheerio = require('cheerio')
//准备抓取的网站链接
,     dataUrl = 'http://www.quanxue.cn/CT_NanHuaiJin/CanChanIndex.html'
,     iconv = require('iconv-lite')
,     mongoose = require('mongoose')
,     Section = require('./models/section')

//连接mongodb 数据库 ，地址为mongodb的地址以及集合名称。
const dbLink = process.env.DBLINK || 'mongodb://localhost:27018/tianye'
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true)
mongoose.connect(dbLink, { useNewUrlParser: true })
http.get(dataUrl, function (res) {
  var length = 0
  var arr_5 = []
  //绑定方法，获取网页数据
  res.on('data', function (chunk) {
    arr_5.push(chunk)
    length += chunk.length
  })
  //数据获取完毕
  res.on('end', async function () {
    //调用下方的函数，得到返回值，即是我们想要的img的src
    var data = Buffer.concat(arr_5, length);
    var change_data = iconv.decode(data,'utf-8')
    let str = change_data.toString()
    let result = getData(str)
    for (let i = 0, l = result.length; i < l; i++) {
      let res = await spider('http://www.quanxue.cn/CT_NanHuaiJin/' + result[i].href)
      result[i].content = res
      // arr_3.push(data[i])
      let id = '5d67af381077f151b5350c89'
      , uid = '5ce64c97d9f9cb18c033a75c'
      await createSection(id, uid, result[i])
      console.log(Math.round(i / l * 100) + '%')
    }
    console.log('complate.....')
    process.exit()
  })
})

function spider(href) {
  return new Promise(function(resove, reject) {
    http.get(href, function (res) {
      var length = 0
      var arr_4 = []
      // let str = ''
      //绑定方法，获取网页数据
      res.on('data', function (chunk) {
        // str += chunk
        arr_4.push(chunk)
        length += chunk.length
      })
      //数据获取完毕
      res.on('end', function () {
        //调用下方的函数，得到返回值，即是我们想要的img的src
        var data = Buffer.concat(arr_4, length);
        var change_data = iconv.decode(data,'utf-8'); 
        let str = change_data.toString()
        let $ = cheerio.load(str)
        let arr = []
        $('.main p').each((k, v) => {
          let res = ''
          let content = '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + $(v).text().replace(/(\r|\n|\s|\t)+/gm, '') + '</p>'
          res = content
          arr.push(res)
        })
        resove(arr.join(''))
      })
    })
  })
}

async function createSection(id, uid, data) {
  const { title, content } = data
  try {
    await Section.create({ 
      title,
      content,
      classic_id: id,
      creator_id: uid
    })
  } catch (err) {
    console.log(err)
  }
}

//根据得到的数据，处理得到自己想要的
function getData(str) {
  //沿用JQuery风格，定义$
  let $ = cheerio.load(str)
  //获取的数据数组
  let arr = $('#txt1 a')
  let dataTemp = []
  //遍历得到数据的src，并放入以上定义的数组中
  arr.each(function(k, v) {
    let text = $(v).text().replace(/(\r|\n|\s|\t)+/gm, '')
    let href = $(v).attr('href').replace(/(\r|\n|\s|\t)+/gm, '')
    dataTemp.push({
      title: text,
      href: href
    })
  })
  //返回出去
  return dataTemp
}

function numberConvertToUppercase() {
  return function(num) {
    num = Number(num);
    var upperCaseNumber = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '亿'];
    var length = String(num).length;
    if (length == 1) {
      return upperCaseNumber[num];
    } else if (length == 2) {
      if (num == 10) {
        return upperCaseNumber[num];
      } else if (num > 10 && num < 20) {
        return '十' + upperCaseNumber[String(num).charAt(1)];
      } else {
        return upperCaseNumber[String(num).charAt(0)] + '十' + upperCaseNumber[String(num).charAt(1)].replace('零', '');
      }
    }
  }
}

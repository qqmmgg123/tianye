require('dotenv').config()
const program = require('commander')
const mongoose = require('mongoose')
const User = require('./models/user')
const Version = require('./models/version')
const fs = require('fs')

const dbLink = process.env.DBLINK || 'mongodb://localhost:27018/tianye'

//连接mongodb 数据库 ，地址为mongodb的地址以及集合名称。
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true)
mongoose.connect(dbLink, { useNewUrlParser: true })

function delDir(path){
  let files = [];
  if(fs.existsSync(path)){
      files = fs.readdirSync(path);
      files.forEach((file, index) => {
          let curPath = path + "/" + file;
          if(fs.statSync(curPath).isDirectory()){
              delDir(curPath); //递归删除文件夹
          } else {
              fs.unlinkSync(curPath); //删除文件
          }
      });
      fs.rmdirSync(path);
  }
}

function delFile(path) {
  return new Promise((resove, reject) => {
    if (fs.existsSync(path)) {
      fs.unlink(path, (err) => {
        if(err){
          reject(err)
        } else {
          resove('文件删除成功')
        }
      });
    } else {
      reject(new Error("文件不存在"))
    }
  })
}

async function addSuper(phone) {
  try {
    await User.updateOne({ phone }, { super: true })
    console.log('已添加' + phone + '为超级管理员')
  } catch (err) {
    console.log('错误:' + err.message)
  }
  process.exit()
}

async function addVersion(newVersion, message) {
  try {
    let versions = await Version.find({}).limit(1).sort({ version_code: -1 })
    , version = versions && versions.length && versions[0]
    , versionCode = +newVersion
    , versionName = (100 + versionCode + '').split('').join('.')
    , oldName = (100 + (versionCode - 1) + '').split('').join('.')
    , options = {
      url: 'https://www.tianyeapp.top/static/Tianyeapp_v' + versionName + '.apk',
      version_code: versionCode,
      update_message: message,
      type: 'android'
    }
    if (version) {
      await Version.updateOne({
        _id: version._id,
      }, options, {
        runValidators: true,
        upsert: true, 
        new: true
      })
    } else {
      await Version.create(options)
    }
    await delFile('./dist/Tianyeapp_v' + oldName + '.apk')
    console.log('已添加版本:' + newVersion)
  } catch (err) {
    console.log('错误:' + err.message)
  }
  process.exit()
}

db.users.find().forEach(function(item){db.parties.insert({name: item.nickname,creator_id:item._id,createdAt:new Date(),updatedAt:new Date()})});
db.minds.find().forEach(function(item){var doc = db.parties.findOne({creator_id:item.creator_id});if(doc){db.minds.updateOne({_id:item._id}, {$set:{party_id:doc._id}});}});

program
  .version('0.1.0')
  .option('-a, --add-super [phone]', 'Add super')
  .option('-v, --add-version [version]', 'Add version')
  .option('-m, --add-version-message [message]', 'Add version message')
  .parse(process.argv)

if (program.addSuper) addSuper(program.addSuper)
if (program.addVersion && program.addVersionMessage) addVersion(program.addVersion, program.addVersionMessage)

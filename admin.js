require('dotenv').config()
const program = require('commander')
const mongoose = require('mongoose')
const User = require('./models/user')
const Version = require('./models/version')

const dbLink = process.env.DBLINK || 'mongodb://localhost:27018/tianye'

//连接mongodb 数据库 ，地址为mongodb的地址以及集合名称。
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true)
mongoose.connect(dbLink, { useNewUrlParser: true })

async function addSuper(email) {
  try {
    await User.updateOne({ email }, { super: true })
    console.log('已添加' + email + '为超级管理员')
  } catch (err) {
    console.log('错误:' + err.message)
  }
  process.exit()
}

async function addVersion(newVersion, message) {
  try {
    let versions = await Version.find({}).limit(1).sort({ version_code: -1 })
    , version = versions && versions.length && versions[0]
    , options = {
      url: 'https://www.tianyeapp.top/static/Tianyemobile-v' + newVersion + '.apk',
      version_code: +newVersion,
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
    console.log('已添加版本:' + newVersion)
  } catch (err) {
    console.log('错误:' + err.message)
  }
  process.exit()
}

program
  .version('0.1.0')
  .option('-a, --add-super [email]', 'Add super')
  .option('-v, --add-version [version]', 'Add version')
  .option('-m, --add-version-message [message]', 'Add version message')
  .parse(process.argv)

if (program.addSuper) addSuper(program.addSuper)
if (program.addVersion && program.addVersionMessage) addVersion(program.addVersion, program.addVersionMessage)

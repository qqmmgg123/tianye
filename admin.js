require('dotenv').config()
const program = require('commander')
const mongoose = require('mongoose')
const User = require('./models/user')

const dbLink = process.env.DBLINK || 'mongodb://localhost:27018/tianye'

//连接mongodb 数据库 ，地址为mongodb的地址以及集合名称。
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true)
mongoose.connect(dbLink, { useNewUrlParser: true })

async function addsuper(username) {
  try {
    await User.updateOne({ username }, { super: true })
    console.log('已添加' + username + '为超级管理员')
  } catch (err) {
    console.log('错误:' + err.message)
  }
  process.exit()
}

program
  .version('0.1.0')
  .option('-a, --addsuper [uid]', 'Add super')
  .parse(process.argv)

if (program.addsuper) addsuper(program.addsuper)

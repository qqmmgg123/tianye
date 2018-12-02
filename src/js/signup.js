import '@babel/polyfill'
import { post } from './lib/request'
import ejs from 'ejs'

globalData.codeBtnDis = false
let globalObject = document.querySelector('form')

// 组件开始
import signupTempHtml from '../../views/signup.html'
let signupTemp = ejs.compile(signupTempHtml)

// 事件触发
document.body.addEventListener('input', (e) => {
  let el = e.target
  if (el.matches('input[name="username"]')) {
    globalData.username = el.value
  } else if (el.matches('input[name="password"]')) {
    globalData.password = el.value
  } else if (el.matches('input[name="email"]')) {
    globalData.email = el.value
  } else if (el.matches('input[name="code"]')) {
    globalData.code = el.value
  }
}, false)

document.body.addEventListener('click', async (e) => {
  let el = e.target
  if (el.matches('[rel-ctl="sendCode"]')) {
    if (globalData.codeBtnDis) return

    console.log('发送验证码点击...')
    e.preventDefault()
    let { email } = globalData
    let res = await post('/email/vcode', {
      email
    })
    if (res.success) {
      let time = 30
      let timer = null
      el.innerHTML = `<span>30</span>秒后重发`
      globalData.codeBtnDis = true
      el.disabled = true
      timer = setInterval(() => {
        if (time <= 0) {
          el.querySelector('span').innerHTML = time--
        } else {
          el.innerHTML = '重新发送'
          globalData.codeBtnDis = false
          el.disabled = false
        }
      }, 1000)
    } else {
      globalData.info = res.info
      globalObject.innerHTML = signupTemp(globalData)
    }
  } else if (el.matches('button[type=submit]')) {
    e.preventDefault()
    let res = await post('/signup', {
      username: globalData.username,
      password: globalData.password,
      email: globalData.email,
      code: globalData.code
    })
    if (res.success) {
      const { redirectUrl = '' } = res
      if (redirectUrl) {
        window.location.replace(redirectUrl)
      }
    } else {
      globalData.info = res.info
      globalObject.innerHTML = signupTemp(globalData)
    }
  }
}, false)
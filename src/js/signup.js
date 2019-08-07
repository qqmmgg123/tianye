import '@babel/polyfill'
import { post } from './lib/request'

// 私有属性 privacy
const _tips = function(type) {
  return document.querySelector(`.${type}-info`)
}
, signupForm = document.querySelector('form')
, inputs = [...signupForm.querySelectorAll('[name]')]
, names = inputs.map(input => input.getAttribute('name'))
, submitBtn = signupForm.querySelector('button[type=submit]')
, codeBtn = signupForm.querySelector('[rel-ctl="sendCode"]')

// 公共属性 public
, CHERRY_RED = '#EE3D80'

// 输入事件触发
signupForm.oninput = (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  let name = el.getAttribute('name')
  if (names.indexOf(name) !== -1) {
    globalData[name] = el.value
    if (name === 'phone') {
      checkPhoneInput()
    }
    checkInput()
  }
}

// 点击时间触发
document.body.addEventListener('click', async (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  // 发送验证码点击
  if (el.matches('[rel-ctl="sendCode"]')) {
    preventDefault(e)
    if (el.disabled) return
    info('vcode', '正在发送验证码...')
    sendCountDown(el)
    let { phone } = globalData
    let res = await post('/phone/vcode', {
      type: 'signup',
      phone
    })
    if (res.success) {
      info('vcode', '验证码发送成功，有效时间10分钟', 2000)
    } else {
      globalData.info = res.info
      error('server', res.info)
    }
  }
}, false)

// 当前模块函数 privacy
function info(type, message, delay) {
  let infoTips = _tips(type)
  infoTips.style.color = '#666666'
  infoTips.innerHTML = message
  infoTips.style.display = ''
  if (delay) {
    let timer = setInterval(() => {
      infoTips.style.display = 'none'
    }, delay)
  }
}

function error(type, message) {
  let infoTips = _tips(type)
  infoTips.style.color = CHERRY_RED
  infoTips.innerHTML = message
  infoTips.style.display = ''
}

function checkInput() {
  let isEveryNoEmpty = names.every(name => globalData[name] && globalData[name].trim())
  if (isEveryNoEmpty) submitBtn.disabled = false
  else submitBtn.disabled = true
}

function checkPhoneInput() {
  let { phone } = globalData
  if (phone && phone.trim()) codeBtn.disabled = false
  else codeBtn.disabled = true
}

// 验证码按钮倒计时
function sendCountDown(btn) {
  let time = 30
  , timer = null
  btn.innerHTML = '<span>30</span>秒后重发'
  btn.disabled = true
  timer = setInterval(() => {
    if (time >= 0) {
      btn.querySelector('span').innerHTML = time--
    } else {
      btn.innerHTML = '重新发送'
      btn.disabled = false
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

// 公共函数 public
function preventDefault(e) {
  if (e.preventDefault) {
    e.preventDefault()
  } else {
    e.returnValue = false
  }
}

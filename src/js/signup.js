if (module.hot) {
  module.hot.accept();
}

import { post } from './lib/request'
import { 
  delegate, 
  addClass, 
  removeClass,
  dispatchEvent
} from '@/js/lib/utils'
import '@/js/common/global'
import '@/sass/common/global.scss'
import '@/sass/signup.scss'

// 私有属性 privacy
const _tips = function(type) {
  return document.querySelector(`.${type}-info`)
}
, signupForm = document.querySelector('form')
, inputs = [...signupForm.querySelectorAll('[name]')]
, names = inputs.map(input => input.name)
, inputChecks = ['nickname', 'password', 'phone_number', 'code']
, submitBtn = signupForm.querySelector('button[type=submit]')
, codeBtn = signupForm.querySelector('[rel-ctl="sendCode"]')
// 区号选择下拉
let selectShow = false
, phoneInput = inputs.find(
  input => input.name === 'phone'
)
, codeIput = inputs.find(
  input => input.name === 'country'
)
, select = document.querySelector('.select')
, selectInput = select.querySelector('.select-input span')
, dropdown = select.querySelector('.dropdown')

// 公共属性 public
, CHERRY_RED = '#EE3D80'

// 输入事件触发
signupForm.oninput = (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  , name = el.name
  , value = el.value
  if (names.indexOf(name) !== -1) {
    globalData[name] = value
    if (name === 'phone_number') {
      let code = selectInput.innerHTML
      , code_num = code.replace('+', '')
      phoneInput.value = [
        code_num, 
        value
      ].join('-')
      dispatchEvent(phoneInput, 'input')
      checkPhoneInput()
    }
    checkInput()
  }
}

// 点击事件触发
delegate(
  document.body, 
  [
    '[rel-ctl="sendCode"]'
  ],
  [
    // 发送验证码
    async function(ev, el) {
      // 发送验证码点击
      preventDefault(ev)
      if (el.disabled) return
      info('vcode', '正在发送验证码...')
      sendCountDown(el)
      let { phone, phone_number, country } = globalData
      let res = await post('/phone/vcode', {
        type: 'signup',
        phone,
        phone_number,
        country
      })
      if (res.success) {
        info('vcode', '验证码发送成功，有效时间10分钟', 2000)
      } else {
        globalData.info = res.info
        error('server', res.info)
      }
    }
  ]
)

// 区号下拉
select.addEventListener('click', function(e) {
  e = window.event || e
  e.stopPropagation()
  if (!selectShow) {
    addClass(dropdown, 'visible')
    selectShow = true
  } else {
    removeClass(dropdown, 'visible')
    selectShow = false
  }      
})

// 点击消失下拉
document.body.addEventListener('click', function(e) {
  removeClass(dropdown, 'visible')
  selectShow = false
})

// 选择下拉区号列表
delegate(
  dropdown, 
  [
    'li'
  ],
  [
    function(ev, el) {
      let codeOption = el.querySelector('.phone-number')
      , code = codeOption.innerHTML
      , code_num = code.replace('+', '')
      , abbr = codeOption.dataset 
      && codeOption.dataset.abbr 
      || codeOption.getAttribute('data-abbr')
      codeIput.value = abbr
      selectInput.innerHTML = code
      phoneInput.value = [
        code_num, 
        globalData.phone_number
      ].join('-')
      dispatchEvent(codeIput, 'input')
      dispatchEvent(phoneInput, 'input')
    }
  ]
)

// 初始化全局数据
globalData.country = 'CN'

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
  let isEveryNoEmpty = inputChecks.every(name => globalData[name] && globalData[name].trim())
  if (isEveryNoEmpty) submitBtn.disabled = false
  else submitBtn.disabled = true
}

function checkPhoneInput() {
  let { phone_number } = globalData
  if (phone_number && phone_number.trim()) codeBtn.disabled = false
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

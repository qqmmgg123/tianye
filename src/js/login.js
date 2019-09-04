if (module.hot) {
  module.hot.accept();
}

import { delegate, addClass, removeClass } from '@/js/lib/utils'
import '@/js/common/global'
import '@/sass/common/global.scss'
import '@/sass/login.scss'

// 区号选择下拉
let selectShow = false
, phoneInput = document.querySelector('input[name=phone]')
, phoneNumberInput = document.querySelector('input[name=phone_number]')
, select = document.querySelector('.select')
, codeIput = select.querySelector('input[name=country]')
, selectInput = select.querySelector('.select-input span')
, dropdown = select.querySelector('.dropdown')

// 输入事件触发
phoneNumberInput.oninput = function() {
  let value = this.value
  , code = selectInput.innerHTML
  , code_num = code.replace('+', '')
  phoneInput.value = [
    code_num, 
    value
  ].join('-')
}

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
        phoneNumberInput.value
      ].join('-')
    }
  ]
)

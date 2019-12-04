if (module.hot) {
  module.hot.accept();
}

import '@/js/common/global'
import '@/sass/common/global.scss'
import '@/sass/particles/quill.viewer.scss'
import '@/sass/mind.scss'
import autosize from 'autosize'
import { post } from '@/js/lib/request'
import { showTroublePop } from '@/js/component/mindpopup'

const { mind = {} } = globalData
if (globalData.is_wechat) {
  let { configWx } = require('./component/wechat')
  configWx({
    share_title: mind.titie || mind.summary,
    share_subtitle: mind.summary
  })
}

// 修改烦恼
const troubleModifyBtn = document.querySelector('[rel-ctl="trouble-modify"]')
troubleModifyBtn && troubleModifyBtn.addEventListener('click', function() {
  mind && showTroublePop(mind)
})

// 发布慰藉
const form = document.querySelector('.reply form')
, inputs = [...form.querySelectorAll('[name]')]
, names = inputs.map(input => input.name)
, submitBtn = form.querySelector('button[type=submit]')
, contentInput = inputs.find(input => input.name === 'content')
, titleInput = inputs.find(input => input.name === 'title')
, err_tips = contentInput.parentNode.querySelector('.tips')
let inputChecks = ['content']
, object = {
  column_id: 'sentence',
  parent_type: 'mind',
  parent_id: mind._id,
  receiver_id: mind.creator_id
}
autosize(contentInput)
form.oninput = function(e) {
  e = window.event || e
  let el = e.srcElement || e.target
  , name = el.name
  if (names.indexOf(name) !== -1) {
    let value = el.value
    , valid = true
    object[name] = value
    if (name === 'content') {
      if (!checkSentenceLength(value)) {
        err_tips.innerHTML = `句子字数不能超过147个字，已经超出${length - 147}个字`
        titleInput.parentNode.style.display = ''
        err_tips.style.display = ''
        inputChecks = ['content', 'title']
        object.column_id = 'article'
        valid = false 
      } else {
        inputChecks = ['content']
        titleInput.parentNode.style.display = 'none'
        err_tips.style.display = 'none'
        object.column_id = 'sentence'
      }
    }
    if (!checkInput(inputChecks, object)) valid = false
    submitBtn.disabled = !valid
  }
}
submitBtn && (submitBtn.onclick = async (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  if (e.preventDefault) {
    e.preventDefault()
  } else {
    e.returnValue = false
  }
  let body = genBody(object, names)
  , url = form.action
  , res
  res = await post(url, body)
  if (res.success) {
    window.location.reload()
  }
})

// 跳转到评论
const { hash } = location
, contentViewer = document.querySelector('.content-viewer')
, maskText = contentViewer.querySelector('.more-text')
, moreMask = contentViewer.querySelector('.more-mask')
if (hash === '#reply') {
  if (contentViewer.offsetHeight > 105) {
    contentViewer.style.height = '105px'
    maskText.style.display = ''
    moreMask.style.display = ''
    contentViewer.onclick = function() {
      contentViewer.style.height = 'auto'
      maskText.style.display = 'none'
      moreMask.style.display = 'none'
    }
  }
  contentInput.focus()
}

// 获取表单数据
function genBody(data, names) {
  let body = {}
  names.forEach(name => {
    data[name] && (body[name] = data[name].trim())
  })
  return body
}

// 当前模块函数 privacy
function checkInput(inputChecks, object) {
  let isEveryNoEmpty = inputChecks.every(name => object[name])
  if (isEveryNoEmpty) return true
  else return false
}

// 句子的字数验证
function checkSentenceLength(text) {
  let formatStr = text.replace(/\r|\n|\t/gm, '').trim()
  , length = formatStr.length
  if (length > 147) {
    return false
  } else {
    return true
  }
}

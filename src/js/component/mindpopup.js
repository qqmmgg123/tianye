import autosize from 'autosize'
import { put, post } from '@/js/lib/request'
import { dispatchEvent } from '@/js/lib/utils'

// 显示烦恼发布窗口
export function showTroublePop(mind) {
  let popup = document.querySelector('.popup')
  if (!popup) {
    popup = document.createElement('div')
    popup.className = 'popup'
    popup.style.display = 'none'
    popup.innerHTML = `
      <div class="popup-inner">
        <div class="popup-header">
          ${mind ? '修改' : '诉说'}烦恼
          <a href="javascript:;">
            <i class="iconfont icon-guanbi"></i>
          </a>
        </div>
        <form method="${mind ? 'put' : 'post'}" action="${mind ? '/mind/' + mind._id : '/mind'}">
          <div class="container">
            <input type="hidden" name="column_id" value="sentence" />
            <input type="hidden" name="type_id" value="help" />
            <div class="form-group" style="display: none;">
              <input name="title" type="text" placeholder="标题" value="${mind && mind.title || ''}">
            </div>
            <div class="form-group">
              <textarea name="content" rows="6" placeholder="说出您内心的纠结、烦恼、与痛苦...">${mind && mind.content || ''}</textarea>
              <div class="tips"></div>
            </div>
            <div class="form-group">
              <input type="text" name="keywords" placeholder="类别或关键词，多个用空格分隔 [非必填]" value="${mind && mind.keywords && mind.keywords.join(' ') || ''}" autocomplete="off" />
            </div>
          </div>
          <div class="popup-footer">
            <button type="submit" disabled>
              ${mind ? '更新' : '送出'}
            </button>
          </div>
        </form>
      </div>
      <div class="mask"></div>
    `
    document.body.appendChild(popup)
    const form = popup.querySelector('form')
    , inner = popup.querySelector('.popup-inner')
    , inputs = [...form.querySelectorAll('[name]')]
    , names = inputs.map(input => input.name)
    , submitBtn = form.querySelector('button[type=submit]')
    , contentInput = inputs.find(input => input.name === 'content')
    , titleInput = inputs.find(input => input.name === 'title')
    , err_tips = contentInput.parentNode.querySelector('.tips')
    let inputChecks = ['content']
    , object = {
      column_id: 'sentence',
      type_id: 'help'
    }
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
            if (!object.title || !object.title.trim()) valid = false 
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
    submitBtn.onclick = async (e) => {
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
      if (!mind) {
        res = await post(url, body)
        if (res.success) {
          window.location.replace('/')
        }
      } else {
        res = await put(url, body)
        if (res.success) {
          window.location.replace('/')
        }
      }
      popup.style.display = 'none'
      document.body.style.overflow = 'auto'
      iosRemovTrouchFn()
    } 
    popup.querySelector('.iconfont').onclick = function() {
      popup.style.display = 'none'
      document.body.style.overflow = 'auto'
      iosRemovTrouchFn()
    }
    autosize(contentInput)
    inner.style.maxHeight = window.innerHeight + 'px'
    if (mind) {
      mind.title && dispatchEvent(titleInput, 'input')
      mind.content && setTimeout(() => dispatchEvent(contentInput, 'input'), 0)
    }
  }
  popup.style.display = ''
  document.body.style.overflow = 'hidden'
  iosTrouchFn()
}

function addT(e){
  e.preventDefault(); //阻止默认事件(上下滑动)
}

function iosRemovTrouchFn() {
  document.body.removeEventListener('touchmove', addT)
}

function iosTrouchFn() {
  document.body.addEventListener('touchmove', addT, { passive: true }) //passive防止阻止默认事件不生效
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
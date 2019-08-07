import '@babel/polyfill'
import './lib/dom'
import { put, post } from './lib/request'

// 其他组件引入
import classicEditor from './component/classiceditor'
classicEditor.create();

// 私有属性 privacy
const classicForm = d.getElementById('classicForm')
, inputs = [...classicForm.querySelectorAll('[name]')]
, names = inputs.map(input => input.getAttribute('name'))
, fileInput = d.querySelector('input[type=file]')
, posterInput = d.querySelector('input[name="poster"]')
, submitBtn = classicForm.querySelector('button[type=submit]')
, minSize = null
, maxSize = '2mb'
, classic = globalData.classic || {}
, { _id } = classic

// 初始化校验表单
if (_id) {
  classic.summary = classic.mind && (classic.mind.content || (classic.mind[0] && classic.mind[0].content)) || ''
  checkInput()
}

// 输入事件触发
classicForm.oninput = (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  let name = el.getAttribute('name')
  if (names.indexOf(name) !== -1) {
    classic[name] = el.value
    checkInput()
  }
}

// 点击事件
classicForm.onclick = async (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  if (el.matches('button[type="submit"]')) {
    if (e.preventDefault) {
      e.preventDefault()
    } else {
      e.returnValue = false
    }
    let body = genBody(classic, names)
    , res
    if (!_id) {
      res = await post(`/classic`, body)
      if (res.success) {
        window.location.replace('/')
      }
    } else {
      res = await put(`/classic/${_id}`, body)
      if (res.success) {
        window.location.replace(`/classic/${_id}`)
      }
    }
  } else if (el.matches('.file-upload a.button')) {
    fileInput.click()
  }
}

// 表单事件
fileInput.onchange = (e) => {
  e = window.event || e
  let files = e.target.files || e.dataTransfer.files
  , file = files[0]
  , maxSizeBytes = stringToByteSize(maxSize) || Number.MAX_SAFE_INTEGER
  , minSizeBytes = stringToByteSize(minSize) || 0

  if(!file) {
    alert('没有选择任何文件')
    return
  }
  if(file.size > maxSizeBytes || file.size < minSizeBytes){
    alert(`文件大小应该在${minSize || minSizeBytes} - ${maxSize || maxSizeBytes}之间`)
    return
  }

  beginUpload(file)
}

// 当前模块函数 privacy
function checkInput() {
  let isEveryNoEmpty = names.every(name => classic[name] && classic[name].trim())
  if (isEveryNoEmpty) submitBtn.disabled = false
  else submitBtn.disabled = true
}

function beginUpload(file) {
  var fd = new FormData();
  fd.append("file", file);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/uploadImg', true);
  xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");

  xhr.upload.onprogress = function(e) {
    if (e.lengthComputable) {
      var percentComplete = (e.loaded / e.total) * 100 + '%'
      var progress = d.querySelector('.progress')
      , pText = progress.querySelector('span')
      progress.style.display = 'block'
      pText.innerHTML = percentComplete
    }
  }
  xhr.onload = function() {
    if (this.status == 200) {
      var res = JSON.parse(this.response)
      if (res && res.img) {
        posterInput.value = res.img
        dispatchEvent(posterInput, 'input')
      }
    }
  }
  xhr.send(fd)
}

// public
function dispatchEvent(el, eventName) {
  let event = new Event(eventName, { bubbles: true });
  // hack React15
  event.simulated = true;
  // hack React16 内部定义了descriptor拦截value，此处重置状态
  let tracker = el._valueTracker;
  if (tracker) {
    tracker.setValue(lastValue);
  }
  el.dispatchEvent(event);
}

function stringToByteSize(str) {
  let result, unit
  , map = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024
  }

  if (!str) {
    return null
  }
  result = /(\d+(?:\.\d+)?)?(B|KB|MB|GB|TB)/i.exec(str)

  if (!result || result.length < 1) {
    return null
  }

  unit = result[2] ? result[2].toUpperCase() : 'B'
  return Math.ceil(parseFloat(result[1]) * map[unit])
}

function genBody(data, names) {
  let body = {}
  names.forEach(name => {
    body[name] = data[name]
  })
  return body
}


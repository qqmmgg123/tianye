if (module.hot) {
  module.hot.accept();
}

import { clearFormat } from '@/js/lib/clearformat'
import { dispatchEvent, stringToByteSize } from '@/js/lib/utils'
import { put, post } from '@/js/lib/request'
import '@/js/common/global'
import '@/js/lib/dom'
import '@/sass/common/global.scss'
import '@/sass/classicmodify.scss'
import '@/sass/particles/quill.editor.scss'
import autosize from 'autosize'

// 私有属性 privacy
const classicForm = d.getElementById('classicForm')
// 表单控制相关
, inputs = [...classicForm.querySelectorAll('[name]')]
, names = inputs.map(input => input.name)
, submitBtn = classicForm.querySelector('button[type=submit]')

// 图片上传相关
const posterInput = inputs.find(
  input => input.name === 'poster'
)
, fileInput = d.querySelector('input[type=file]')
, uploadBtn = d.querySelector('.file-upload a.button')
, progress = d.querySelector('.progress')
, pText = progress && progress.querySelector('span')
, preview = d.querySelector('.preview')
, { classic, mind } = globalData
// 图片上传相关
let minSize = null
, maxSize = '2mb'

// 添加章节相关
const addSectionBtn = d.querySelector('[ref=add-section]')
// 化书写相关
, titleInput = inputs.find(input => input.name === 'title')

// 初始化内容
let object = null
, inputChecks = []
, initalChecks = []
, _id = ''

// 推荐内容
if (typeof classic !== 'undefined') {
  object = classic || {}
  _id = object._id || ''
  initalChecks = inputChecks = ['reason', 'original_author', 'source', 'content']
  // 初始化校验表单
  if (_id) {
    object.reason = object.mind && (object.mind.content || (object.mind[0] && object.mind[0].content)) || ''
    checkInput()
  }
}

// 原创内容
if (typeof mind !== 'undefined') {
  object = mind || {}
  _id = object._id || ''
  initalChecks = inputChecks = ['content']
  // 初始化校验表单
  if (_id) {
    object.title && (inputChecks.push('title'))
    checkInput()
  } else {
    object.type_id = 'share'
  }
  // 只有mind类型要填关键字
  object.keywords && (object.keywords = object.keywords.join(' '))
}

// 原创与推荐公共部分
if (object) {
  object.column_id = object.column_id || 'sentence'
}

// 初始化推荐
let reasonInput = document.querySelector('textarea[name=reason]')
reasonInput && autosize(reasonInput)

// 初始化文章编辑器
let outPutEl = document.querySelector('textarea[name=content]')
, editor_tips = outPutEl.parentNode.querySelector('.tips')
, toolbar = document.getElementById('mind-toolbar')
, editor = new Quill('#mind-editor', {
  modules: { toolbar },
  theme: 'snow'
})
, editorCon = editor.container.parentNode
, placeholder = editorCon.querySelector('span.placeholder')
, blankHtml = '<p><br></p>'
, medias = ['image', 'video']
medias.forEach(type => {
  editor.getModule('toolbar').addHandler(type, () => {
    selectLocalMedia(type);
  })
})
editor.on('text-change', function(delta, oldDelta, source) {
  let html = editor.root.innerHTML 
  html = html === blankHtml ? '' : html
  togglePlaceholder(html)
  let editor_value = html
  outPutEl.value = editor_value
  dispatchEvent(outPutEl, 'input')
})
autosize(outPutEl)

// 输入事件触发
classicForm.oninput = (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  , name = el.name
  if (names.indexOf(name) !== -1) {
    let value = el.value
    , valid = true
    object[name] = value
    if (name === 'content') {
      if (object.column_id === 'sentence') {
        if (!checkSentenceLength(el, value)) valid = false
      }
    } else if (name === 'reason') {
      if (!checkSentenceLength(el, value)) valid = false
    }
    if (!checkInput()) valid = false
    submitBtn.disabled = !valid
  }
}

// 输入事件触发
classicForm.onchange = (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  , name = el.name
  , value = el.value
  if (name === 'column_id') {
    changeColumnType(value)
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
    let body = genBody(object, names)
    , url = classicForm.action
    , res
    if (!_id) {
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
  // 上传封面操作
  } else if (el.matches('.file-upload a.button')) {
    fileInput && fileInput.click()
  } else if (el.matches('.preview .iconfont')) {
    posterInput.value = ''
    uploadBtn.style.display = ''
    preview.style.display = 'none'
    preview.style.backgroundImage = 'none'
  }
}

// 添加章节操作
addSectionBtn && (addSectionBtn.onclick = (e) => {
  e = window.event || e
  if (e.preventDefault) {
    e.preventDefault()
  } else {
    e.returnValue = false
  }
  if (_id) {
    window.location.href = `/section/${globalData.classic._id}/create`
    return
  }
  let popup = document.querySelector('.popup')
  if (!popup) {
    popup = document.createElement('div')
    popup.className = 'popup'
    popup.style.display = 'none'
    popup.innerHTML = `
      <div class="popup-inner">
        <div class="popup-header">
          添加章节
          <a href="javascript:;">
            <i class="iconfont icon-guanbi"></i>
          </a>
        </div>
        <div class="tips">给作品添加章节前请先将作品发布！</div>
        <div class="bottom-bar">
          <button>
            确定
          </button>
        </div>
      </div>
      <div class="mask"></div>
    `
    document.body.appendChild(popup)
    popup.querySelector('.iconfont').onclick = function() {
      popup.style.display = 'none'
    }
    popup.querySelectorAll('button').onclick = async function() {
      popup.style.display = 'none'
    }
  }
  popup.style.display = ''
})

// 表单事件
fileInput && (fileInput.onchange = (e) => {
  e = window.event || e
  let files = e.target.files || e.dataTransfer.files
  , file = files[0]
  , maxSizeBytes = stringToByteSize(maxSize) || Number.MAX_SAFE_INTEGER
  , minSizeBytes = stringToByteSize(minSize) || 0

  if (!file) {
    alert('没有选择任何文件')
    return
  }

  if (file.size > maxSizeBytes || file.size < minSizeBytes){
    alert(`文件大小应该在${minSize || minSizeBytes} - ${maxSize || maxSizeBytes}之间`)
    return
  }

  beginUpload(file)
})

// 初始化书写类型
changeColumnType(object.column_id)

// 上传编辑器图片、视频
function selectLocalMedia(type) {
  let accept = ''
  switch(type) {
    case 'image':
      maxSize = '2M'
      accept = 'image/gif, image/png, image/jpeg, image/jpg, image/bmp, image/webp'
      break
    case 'video':
      maxSize = '25M'
      accept = 'video/mp4, video/x-m4v'
      break
  }
  let input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', accept)
  // Listen upload local image and save to server
  input.onchange = (e) => {
    e = window.event || e
    const files = e.target.files || e.dataTransfer.files
    , file = files[0]
    , maxSizeBytes = stringToByteSize(maxSize) || Number.MAX_SAFE_INTEGER
    , minSizeBytes = stringToByteSize(minSize) || 0

    if (!file) {
      alert('没有选择任何文件')
      return
    }
    if (file.size > maxSizeBytes || file.size < minSizeBytes){
      alert(`文件大小应该在${minSize || minSizeBytes} - ${maxSize || maxSizeBytes}之间`)
      return
    }

    // file type is only image.
    let reg = new RegExp(`^${type}\/`)
    , mediaName = {
      image: '图片',
      video: '视频'
    }[type]
    if (reg.test(file.type)) {
      saveToServer(file, type);
      input = null
    } else {
      alert(`只能选择${mediaName}文件`)
    }
  }
  input.click()
}

// 上传图片、视频至服务器
function saveToServer(file, type) {
  let fd = new FormData()
  , url = {
    image: 'uploadImg',
    video: 'uploadVideo'
  }[type]
  fd.append("file", file)
  var xhr = new XMLHttpRequest()
  xhr.open('POST', `/${url}`, true)
  xhr.setRequestHeader("x-requested-with", "XMLHttpRequest")
  xhr.onload = function() {
    if (this.status == 200) {
      var res = JSON.parse(this.response)
      , key = type === 'video' ? type : 'img'
      if (res && res[key]) {
        const url = res[key];
        insertToEditor(type, url);
      }
    }
  }
  xhr.send(fd)
}

function insertToEditor(type, url) {
  // push image url to rich editor.
  const range = editor.getSelection();
  editor.insertEmbed(range.index, type, url);
}

function beginUpload(file) {
  var fd = new FormData();
  fd.append("file", file);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/uploadImg', true);
  xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");

  xhr.upload.onprogress = function(e) {
    if (e.lengthComputable) {
      let percentComplete = (e.loaded / e.total) * 100 + '%'
      progress.style.display = ''
      pText.innerHTML = percentComplete
    }
  }
  xhr.onload = function() {
    if (this.status == 200) {
      let res = JSON.parse(this.response)
      if (res && res.img) {
        posterInput.value = res.img
        progress.style.display = 'none'
        pText.innerHTML = ''
        uploadBtn.style.display = 'none'
        preview.style.display = ''
        let pic = new Image()
        pic.src = res.img
        pic.onload = () => {
          preview.style.backgroundImage = `url(${res.img})`
          pic = null
        }
        dispatchEvent(posterInput, 'input')
      }
    }
  }
  xhr.send(fd)
}

// 当前模块函数 privacy
function checkInput() {
  let isEveryNoEmpty = inputChecks.every(name => object[name])
  if (isEveryNoEmpty) return true
  else return false
}

// 句子的字数验证
function checkSentenceLength(el, text) {
  let formatStr = text.replace(/\r|\n|\t/gm, '').trim()
  , length = formatStr.length
  , err_tips = el.parentNode.querySelector('.tips')
  if (length > 147) {
    err_tips.innerHTML = `句子字数不能超过147个字，已经超出${length - 147}个字`
    err_tips.style.display = ''
    return false
  } else {
    err_tips.style.display = 'none'
    return true
  }
}

// public
function genBody(data, names) {
  let body = {}
  names.forEach(name => {
    data[name] && (body[name] = data[name].trim())
  })
  return body
}

// 更换书写类型
function changeColumnType(type) {
  switch(type) {
    case 'sentence':
      titleInput && (titleInput.parentNode.style.display = 'none')
      uploadBtn && (uploadBtn.innerHTML = '上传图片')
      posterInput && (posterInput.parentNode.style.display = '')
      addSectionBtn && (addSectionBtn.style.display = 'none')
      outPutEl && (outPutEl.style.display = '')
      let text = clearFormat(outPutEl.value)
      outPutEl.value = text
      dispatchEvent(outPutEl, 'input')
      editorCon.style.display = 'none'
      toolbar.style.display = 'none'
      inputChecks = initalChecks
      break
    case 'article':
      titleInput && (titleInput.parentNode.style.display = '')
      uploadBtn && (uploadBtn.innerHTML = '上传封面')
      posterInput && (posterInput.parentNode.style.display = '')
      addSectionBtn && (addSectionBtn.style.display = 'none')
      outPutEl && (outPutEl.style.display = 'none')
      editor.pasteHTML(outPutEl.value);
      editorCon.style.display = ''
      toolbar.style.display = ''
      inputChecks = initalChecks.concat([ 'title' ])
      editor_tips.style.display = 'none'
      break
    case 'works':
      titleInput && (titleInput.parentNode.style.display = '')
      uploadBtn && (uploadBtn.innerHTML = '上传封面')
      posterInput && (posterInput.parentNode.style.display = '')
      addSectionBtn && (addSectionBtn.style.display = '')
      outPutEl && (outPutEl.style.display = 'none')
      editor.pasteHTML(outPutEl.value);
      editorCon.style.display = ''
      toolbar.style.display = ''
      inputChecks = initalChecks.concat([ 'title', 'poster' ])
      editor_tips.style.display = 'none'
      break
  }
}

// 公共函数
function togglePlaceholder(html) {
  placeholder.style.display = html ? 'none' : ''
}

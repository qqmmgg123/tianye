if (module.hot) {
  module.hot.accept();
}

import { dispatchEvent } from '@/js/lib/utils'
import { clearFormat } from '@/js/lib/clearformat'
import { put, post } from '@/js/lib/request'
import '@/js/common/global'
import '@/js/lib/dom'
import '@/sass/common/global.scss'
import '@/sass/classicmodify.scss'
import classicEditor from './component/classiceditor'

// 私有属性 privacy
const classicForm = d.getElementById('classicForm')
// 表单控制相关
, inputs = [...classicForm.querySelectorAll('[name]')]
, names = inputs.map(input => input.name)
, submitBtn = classicForm.querySelector('button[type=submit]')
, columnInput = inputs.find(
  input => input.name === 'column_id'
)

// 图片上传相关
const posterInput = inputs.find(
  input => input.name === 'poster'
)
, fileInput = d.querySelector('input[type=file]')
, minSize = null
, maxSize = '2mb'
, { classic, mind } = globalData

// 添加章节相关
const addSectionBtn = d.querySelector('button[ref=add-section]')

// 初始化编辑器类型
let object = null
, inputChecks = []
, initalChecks = []
, _id = ''
if (typeof classic !== 'undefined') {
  object = classic || {}
  _id = object._id || ''
  initalChecks = inputChecks = ['original_author', 'source', 'content']
  // 初始化校验表单
  if (_id) {
    object.reason = object.mind && (object.mind.content || (object.mind[0] && object.mind[0].content)) || ''
    checkInput()
  }
}
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
if (object) {
  object.column_id = object.column_id || 'sentence'
}

// 输入事件触发
classicForm.oninput = (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  , name = el.name
  if (names.indexOf(name) !== -1) {
    let value = el.value
    object[name] = value
    if (name === 'column_id') {
      changeColumnType(value)
    }
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
        window.location.replace(url)
      }
    }
  // 上传封面操作
  } else if (el.matches('.file-upload a.button')) {
    fileInput && fileInput.click()
  }
}

// 添加章节操作
addSectionBtn && (addSectionBtn.onclick = (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  if (e.preventDefault) {
    e.preventDefault()
  } else {
    e.returnValue = false
  }
  let popup = document.createElement('div')
  popup.className = 'popup'
  popup.innerHTML = `
    <div class="popup-inner">
      <div class="popup-header">
        添加章节
        <a href="javascript:;">
          <i class="iconfont icon-guanbi"></i>
        </a>
      </div>
      <div class="tips">!添加章节前需要给作品添加标题和封面</div>
      <div class="form-group">
        <input name="title" placeholder="标题" autocomplete="off" />
      </div>
      <div class="form-group">
        <div class="file-upload">
          <a class="button" href="javascript:;">上传封面</a>
          <div style="display: none;" class="progress">上传进度：<span>0%</span></div> 
        </div>
        <input type="hidden" name="poster" value="<%= classic && classic.poster || '' %>" />
      </div>
      <div class="bottom-bar">
        <button type="submit">
          下一步
        </button>
        <button>
          取消
        </button>
      </div>
    </div>
    <div class="mask"></div>
  `
  document.body.appendChild(popup)
})

// 表单事件
fileInput && (fileInput.onchange = (e) => {
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
})

// 创建富文本编辑器
let titleField = null
, bindEl = document.getElementById('editor')
, outputEl = document.getElementById('html-output')
, editor = classicEditor.create({ 
  bindEl, 
  outputEl,
  onPreInput(html) {
    return new Promise((resolve, reject) => {
      let str = clearFormat(html)
      if (str.length > 147) {
        resolve({ needAsk: false })
        if (columnInput.value !== 'article') {
          columnInput.value = 'article'
          editor.showActionBar()
          if (!titleField) {
            titleField = d.createElement('div')
            let titleInput = d.createElement('input')
            , curFleid = outputEl.parentNode
            , tips = curFleid.querySelector('.tips')
            titleInput.name = 'title'
            titleInput.type = 'text'
            titleInput.placeholder = '标题'
            titleField.className = 'form-group'
            titleField.appendChild(titleInput)
            classicForm.insertBefore(titleField, curFleid)
            tips.style.display = ''
            tips.innerHTML = '您输入的内容超过147个字，请填写标题并使用文章格式。'
            names.push('title')
            inputChecks.push('title')
          }
        }
      } else {
        if (columnInput.value !== 'sentence') {
          let popup = confirm("您输入的内容少于147个字，将会清除格式!");
          if (popup == true) {
            resolve({ needAsk: true, html: str  })
            columnInput.value = 'sentence'
            editor.hideActionBar()
            if (titleField) {
              classicForm.removeChild(titleField)
              let index = names.indexOf('title')
              , curFleid = outputEl.parentNode
              , tips = curFleid.querySelector('.tips')
              tips.innerHTML = ''
              tips.style.display = 'none'
              index !== -1 && names.splice(index, 1)
              index = inputChecks.indexOf('title')
              index !== -1 && inputChecks.splice(index, 1)
              titleField = null
            }
          } else {
            resolve({ needAsk: true, html: outputEl.value })
          }
          return
        }
        resolve({ needAsk: false })
      }
    })
  }
})

// 初始化书写类型
let titleInput = inputs.find(input => input.name === 'title')
changeColumnType(object.column_id)

// 函数列表
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

// 当前模块函数 privacy
function checkInput() {
  let isEveryNoEmpty = inputChecks.every(name => object[name])
  if (isEveryNoEmpty) submitBtn.disabled = false
  else submitBtn.disabled = true
}

// public
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
    data[name] && (body[name] = data[name].trim())
  })
  return body
}

// 更换书写类型
function changeColumnType(type) {
  switch(type) {
    case 'sentence':
      titleInput && (titleInput.parentNode.style.display = 'none')
      posterInput && (posterInput.parentNode.style.display = 'none')
      addSectionBtn && (addSectionBtn.style.display = 'none')
      inputChecks = initalChecks
      break
    case 'article':
      titleInput && (titleInput.parentNode.style.display = '')
      posterInput && (posterInput.parentNode.style.display = 'none')
      addSectionBtn && (addSectionBtn.style.display = 'none')
      inputChecks = initalChecks.concat([ 'title' ])
      break
    case 'works':
      titleInput && (titleInput.parentNode.style.display = '')
      posterInput && (posterInput.parentNode.style.display = '')
      addSectionBtn && (addSectionBtn.style.display = '')
      inputChecks = initalChecks.concat([ 'title', 'poster' ])
      break
  }
}

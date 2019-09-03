if (module.hot) {
  module.hot.accept();
}

import { clearFormat } from '@/js/lib/clearformat'
import '@/js/lib/dom'
import { put } from '@/js/lib/request'
import '@/js/common/global'
import '@/sass/common/global.scss'
import '@/sass/sectioneditor.scss'
import classicEditor from '@/js/component/classiceditor'

const sectionForm = d.getElementById('sectionForm')
, method = sectionForm.getAttribute('method')
, fileInput = d.querySelector('input[type=file]')
, audioInput = d.querySelector('input[name="audio"]')
, minSize = null
, maxSize = '25mb'

// 编辑器
let titleField = null
, bindEl = document.getElementById('editor')
, outputEl = document.getElementById('html-output')
, editor = classicEditor.create({ 
  bindEl, 
  outputEl,
  onPreInput(html) {
    return new Promise((resolve, reject) => {
      resolve({ needAsk: false })
    })
  }
})

// 表单事件
fileInput && (fileInput.onchange = (e) => {
  e = window.event || e
  let files = e.target.files || e.dataTransfer.files
  , file = files[0]
  , maxSizeBytes = stringToByteSize(maxSize) || 1024
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

sectionForm.onclick = async (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  if (el.matches('button[type="submit"]')) {
    if (method === 'put') {
      e.preventDefault()
      for (let field of sectionForm.querySelectorAll('[name]')) {
        globalData.section[field.name] = field.value
      }
      let path = `/section/${globalData.section._id}`
      let res = await put(path, globalData.section)
      if (res) {
        const { success } = res
        if (success) {
          window.location.href = path
        }
      }
    }
  } else if (el.matches('.file-upload a.button')) {
    fileInput && fileInput.click()
  }
}

function beginUpload(file) {
  var fd = new FormData();
  fd.append("file", file);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/uploadAudio', true);
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
  xhr.onerror = function(err) {
    console.log(err)
  }
  xhr.onload = function() {
    if (this.status == 200) {
      var res = JSON.parse(this.response)
      if (res && res.audio) {
        console.log(res.audio)
        audioInput.value = res.audio
      }
    }
  }
  xhr.send(fd)
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

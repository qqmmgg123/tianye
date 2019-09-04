if (module.hot) {
  module.hot.accept();
}

import '@/sass/common/global.scss'
import '@/sass/sectioneditor.scss'
import '@/sass/particles/quill.editor.scss'
import '@/js/lib/dom'
import '@/js/common/global'
import { stringToByteSize } from '@/js/lib/utils'
import { put } from '@/js/lib/request'
import { ImageResize } from 'quill-image-resize-module';

// 初始化文章编辑器
let outPutEl = d.querySelector('textarea[name=content]')
, toolbar = d.getElementById('section-toolbar')
, editor = new Quill('#section-editor', {
  modules: { 
    imageResize: {
      displaySize: true
    },
    toolbar 
  },
  theme: 'snow'
})
, editorCon = editor.container.parentNode
, placeholder = editorCon.querySelector('span.placeholder')
, blankHtml = '<p><br></p>'
// quill editor add image handler
editor.getModule('toolbar').addHandler('image', () => {
  selectLocalImage();
})
editor.on('text-change', function(delta, oldDelta, source) {
  let html = getEditorHtml()
  togglePlaceholder(html)
  let editor_value = html
  outPutEl.value = editor_value
})
editorCon.style.display = ''
toolbar.style.display = ''
let html = getEditorHtml()
togglePlaceholder(html)

// 表单控制
const sectionForm = d.getElementById('sectionForm')
, method = sectionForm.getAttribute('method')

if (method === 'put') {
  sectionForm.addEventListener('click', async (e) => {
    let el = e.target
    if (el.matches('button[type="submit"]')) {
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
  }, false)
}

// 获得编辑器内容
function getEditorHtml() {
  let html = editor.root.innerHTML 
  html = html === blankHtml ? '' : html
  return html
}

// 公共函数
function togglePlaceholder(html) {
  placeholder.style.display = html ? 'none' : ''
}

const input = document.createElement('input')
input.setAttribute('type', 'file')
input.setAttribute('accept', 'image/gif, image/png, image/jpeg, image/jpg, image/bmp, image/webp')
// Listen upload local image and save to server
input.onchange = (e) => {
  console.log(e)
  e = window.event || e
  const files = e.target.files || e.dataTransfer.files
  , file = files[0]
  , minSize = null
  , maxSize = '2mb'
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

  // file type is only image.
  if (/^image\//.test(file.type)) {
    saveToServer(file);
  } else {
    alert('只能选择图片文件')
  }
}
// 上传编辑器图片
function selectLocalImage() {
  input.click()
}

// 上传图片至服务器
function saveToServer(file) {
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
        const url = res.img;
        insertToEditor(url);
      }
    }
  }
  xhr.send(fd)
}

function insertToEditor(url) {
  // push image url to rich editor.
  const range = editor.getSelection();
  editor.insertEmbed(range.index, 'image', url);
}

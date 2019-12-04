if (module.hot) {
  module.hot.accept();
}

import { del, post } from '@/js/lib/request'
import { delegate } from '@/js/lib/utils'
import '@/js/common/global'
import '@/js/component/audioplay'
import '@/sass/common/global.scss'
import '@/sass/particles/quill.viewer.scss'
import '@/sass/classic.scss'
import autosize from 'autosize'

const d = document
, sectionList = d.getElementById('sections')
, removeBtn   = d.querySelector('[rel-ctl="classic-remove"]')
, player = d.querySelector('#player')
, playSections = (globalData.sections || []).filter(section => !!section.audio)
, playEls = [...document.querySelectorAll('[rel-ctl=section-play]')]
, playList = playSections.map(item => {
  return {'_id': item._id, 'icon': null, 'title': item.title, 'file': item.audio}
})

// 是否为第一次播放
let firstPlay = true

if (playList.length > 0) {
  // 音频播放器
  AP.init({
    container:'#player',//a string containing one CSS selector
    volume   : 0.7,
    notification: false,
    playList,
    onTogglePlay,
    onPrev: playByIndex,
    onNext: playByIndex
  })
}

removeBtn && (removeBtn.onclick = function(e) { 
  e = window.event || e
  let el = e.srcElement || e.target
  , id = el.dataset && el.dataset.id || el.getAttribute('data-id')
  del(`/mind/${id}`)
  .then(function(res) {
    if (res) {
      let { success } = res
      if (success) {
        window.location.replace('/')
      }
    }
  })
})

sectionList && (delegate(
  sectionList, 
  [
    '[rel-ctl=section-remove]',
    '[rel-ctl=section-play]'
  ],
  [
    function(ev, el) {
      let hiding = ((el.dataset && el.dataset.hiding || el.getAttribute('data-hiding')) === 'true')
      if (!hiding) {
        let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
        del(`/section/${id}`)
        .then(function(res) {
          if (res) {
            let { success } = res
            if (success) {
              let item = el.closest('li.item')
              item.addEventListener("transitionend", (event) => {
                item.parentNode.removeChild(item)
                window.location.reload()
                el.dataset.hiding = true
              }, false);
              item.className = 'item fade hide'
            }
          }
        })
        .catch(err => {
          console.log(err)
        })
      }
    },
    function(ev, el) {
      let icon = el.querySelector('i')
      , id = el.getAttribute('data-id')
      , index = playList.findIndex(item => item._id === id)
      , currIndex = AP.getIndex()
      if (index === currIndex) {
        if (hasClass(icon, 'icon-bofang')) {
          el.innerHTML = '<i class="iconfont icon-pause"></i>暂停'
        } else if (hasClass(icon, 'icon-pause')) {
          el.innerHTML = '<i class="iconfont icon-bofang"></i>播放'
        }
        AP.playToggle()
      } else {
        playEls.forEach((item, i) => {
          if (i === index) {
            item.innerHTML = '<i class="iconfont icon-pause"></i>暂停'
          } else {
            item.innerHTML = '<i class="iconfont icon-bofang"></i>播放'
          }
        })
        AP.play(index)
      }
      if (firstPlay) {
        player && (player.style.display = '')
        firstPlay = false
      }
    }
  ]
))

// 发布评论
const mind = globalData && globalData.classic && globalData.classic.mind || {}
, form = document.querySelector('.reply form')
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
, contentViewer = document.querySelector('.content')
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

// provite method
// 音乐播放器切换播放/暂停
function onTogglePlay(index) {
  let el = playEls.find((item, i) => i === index)
  , icon = el.querySelector('i')
  if (hasClass(icon, 'icon-bofang')) {
    el.innerHTML = '<i class="iconfont icon-pause"></i>暂停'
  } else if (hasClass(icon, 'icon-pause')) {
    el.innerHTML = '<i class="iconfont icon-bofang"></i>播放'
  }
}

// 播放指定音乐
function playByIndex(index) {
  playEls.forEach((item, i) => {
    if (i === index) {
      item.innerHTML = '<i class="iconfont icon-pause"></i>暂停'
    } else {
      item.innerHTML = '<i class="iconfont icon-bofang"></i>播放'
    }
  })
}

function hasClass(obj, cls) {
  return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}

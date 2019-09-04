if (module.hot) {
  module.hot.accept();
}

import { del } from '@/js/lib/request'
import { delegate } from '@/js/lib/utils'
import '@/js/common/global'
import '@/js/component/audioplay'
import '@/sass/common/global.scss'
import '@/sass/particles/quill.viewer.scss'
import '@/sass/classic.scss'

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

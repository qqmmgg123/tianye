if (module.hot) {
  module.hot.accept();
}

import '@/sass/common/global.scss'
import '@/sass/diary.scss'
import '@/js/common/global'
import '@/js/common/talktrouble'
import { get, del } from './lib/request'
import { showTroublePop } from '@/js/component/mindpopup'

const d = document

let keywordList = d.querySelector('.keyword-list')
, showMore = document.querySelector('.show-more')
, isMoreShow = false
if (keywordList) {
  if (keywordList.offsetHeight > 88) {
    keywordList.style.height =  '88px'
    showMore.style.display = ''
  }
  showMore.addEventListener('click', function() {
    if (!isMoreShow) {
      keywordList.style.height = 'auto'
      showMore.querySelector('span').innerHTML = '点击收起'
      showMore.querySelector('i').style.transform = 'rotate(90deg)'
      isMoreShow = true
    } else {
      keywordList.style.height = '88px'
      showMore.querySelector('span').innerHTML = '点击展开更多'
      showMore.querySelector('i').style.transform = 'rotate(-90deg)'
      isMoreShow = false
    }
  })
}

const diaryList = d.getElementById('diarys')
diaryList.addEventListener('click', async (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  if (el.matches('[rel-ctl="diary-remove"]')) {
    let hiding = ((el.dataset && el.dataset.hiding || el.getAttribute('data-hiding')) === 'true')
    if (!hiding) {
      let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
      , res = await del(`/mind/${id}`)
      if (res.success) {
        let item = el.closest('li.item')
        item.addEventListener("transitionend", (event) => {
          item.parentNode.removeChild(item)
          window.location.reload()
          el.dataset.hiding = true
        }, false);
        item.className = 'item fade hide'
      }
    }
  } else if (el.matches('[rel-ctl="trouble-modify"]')) {
    let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
    , res = await get(`/mind/${id}/modify`)
    if (res && res.success && res.mind) {
      showTroublePop(res.mind)
    }
  }
}, false)

if (module.hot) {
  module.hot.accept();
}

import { del } from './lib/request'
import '@/js/common/global'
import '@/sass/common/global.scss'
import '@/sass/diary.scss'

const d = document,
diaryList = d.getElementById('diarys')

diaryList.addEventListener('click', async (e) => {
  e = window.event || e
  let el = e.srcElement || e.target
  if (el.matches('[rel-ctl="diary-remove"]')) {
    let hiding = ((el.dataset && el.dataset.hiding || el.getAttribute('data-hiding')) === 'true')
    if (!hiding) {
      let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
      let res = await del(`/mind/${id}`)
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
  }
}, false)

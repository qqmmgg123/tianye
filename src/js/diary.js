import '@babel/polyfill'
import { del } from './lib/request'

const d = document,
diaryList = d.getElementById('diarys')

diaryList.addEventListener('click', async (e) => {
  let el = e.target
  if (el.matches('[rel-ctl="diary-remove"]')) {
    let hiding = ((el.dataset && el.dataset.hiding || el.getAttribute('data-hiding')) === 'true')
    if (!hiding) {
      let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
      let res = await del(`/diary/${id}`)
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

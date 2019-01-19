import '@babel/polyfill'
import { get, del, post } from './lib/request'
import ejs from 'ejs'

const d = document,
translateList = d.getElementById('translates')

translateList.addEventListener('click', async (e) => {
  let el = e.target
  while (el && el !== e.currentTarget) {
    if (el.matches('[rel-ctl="translate-remove"]')) {
      let hiding = ((el.dataset && el.dataset.hiding || el.getAttribute('data-hiding')) === 'true')
      if (!hiding) {
        let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
        let res = await del(`/translate/${id}`)
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
      }
      return
    }
    el = el.parentElement
  }
}, false)
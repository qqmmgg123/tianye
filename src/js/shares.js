import '@babel/polyfill'
import ejs from 'ejs'
import './lib/dom'
import { get, post, del } from './lib/request'

// 其他组件引入
import shareEditor from './component/shareeditor'
shareEditor.create()

// 组件开始
import shareListTempHtml from "../../views/particles/sharelist.html"
let shareListTemp = ejs.compile(shareListTempHtml)

const navList = d.getElementById('column-nav'),
shareList = d.getElementById('shares')

navList.addEventListener('click', async (e) => {
  let el = e.target
  if (el.matches('[rel-ctl="column-nav-switch"]')) {
    let id = el.dataset.id
    let res = await get(`/column/${id}`)
    if (res.success) {
      globalData.shares = res.shares
      shareList.innerHTML = shareListTemp(globalData)
    }
  }
}, false)

shareList.addEventListener('click', async (e) => {
  let el = e.target
  if (el.matches('[rel-ctl="share-thank"]')) {
    let shareId = el.dataset && el.dataset.id || el.getAttribute('data-id')
    let res = await post(`/thank/${shareId}`)
    if (res.success) {
      el.outerHTML = '已感恩'
    }
  } else if (el.matches('[rel-ctl="share-remove"]')) {
    let hiding = ((el.dataset && el.dataset.hiding || el.getAttribute('data-hiding')) === 'true')
    if (!hiding) {
      let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
      let res = await del(`/share/${id}`)
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

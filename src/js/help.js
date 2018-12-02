import '@babel/polyfill'
import './lib/dom'
import { del, post } from './lib/request'
import ejs from 'ejs'

// 回复输入框
import replyEditorTempHtml from '../../views/particles/replyeditor.html'
let replyEditorTemp = ejs.compile(replyEditorTempHtml)

document.body.addEventListener('click', async (e) => {
  let el = e.target
  if (el.matches('[rel-ctl="trouble-remove"]')) {
    let hiding = ((el.dataset && el.dataset.hiding || el.getAttribute('data-hiding')) === 'true')
    if (!hiding) {
      let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
      let res = await del(`/trouble/${id}`)
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
  } else if (el.matches('[rel-ctl="trouble-reply"]')) {
    let replyId = el.dataset && el.dataset.id || el.getAttribute('data-id')
    let parentId = el.dataset && el.dataset.pid || el.getAttribute('data-pid')
    let replyType = el.dataset && el.dataset.type || el.getAttribute('data-type')
    let parentType = el.dataset && el.dataset.ptype || el.getAttribute('data-ptype')
    let shown = (el.dataset && el.dataset.shown || el.getAttribute('data-shown')) === 'true'
    if (!shown) {
      el.closest('.bottom-bar').insertAdjacentHTML('afterend', replyEditorTemp({ 
        replyId, 
        parentId, 
        replyType, 
        parentType, 
        refId: ''
      }))
      if (el.dataset) {
        el.dataset.shown = 'true'
      } else {
        el.getAttribute('data-shown', 'true') 
      }
    }
  } else if (el.matches('[rel-ctl="reply-send"]')) {
    let replyId = el.dataset && el.dataset.id || el.getAttribute('data-id')
    let parentId = el.dataset && el.dataset.pid || el.getAttribute('data-pid')
    let replyType = el.dataset && el.dataset.type || el.getAttribute('data-type')
    let parentType = el.dataset && el.dataset.ptype || el.getAttribute('data-ptype')
    let replyEditor = el.closest('.replyEditor')
    let content = replyEditor.querySelector('textarea').value
    let res = await post(`/${replyType}/${replyId}/reply`, { 
      content,
      parent_id: parentId,
      parent_type: parentType
    })
    if (res.success) {
      let troubleItem = replyEditor.parentNode
      troubleItem.removeChild(replyEditor)
      let replyButton = troubleItem
      .querySelector('.bottom-bar')
      .querySelector('[rel-ctl="trouble-reply"]')
      if (replyButton.dataset) {
        replyButton.dataset.shown = 'false'
      } else {
        replyButton.getAttribute('data-shown', 'false') 
      }
    }
  } else if (el.matches('[rel-ctl="reply-remove"]')) {
    let hiding = ((el.dataset && el.dataset.hiding || el.getAttribute('data-hiding')) === 'true')
    if (!hiding) {
      let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
      let res = await del(`/reply/${id}`)
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
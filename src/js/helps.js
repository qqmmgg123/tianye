import '@babel/polyfill'
import { del, post } from './lib/request'
import ejs from 'ejs'
import replyEditorTempHtml from '../../views/particles/replyeditor.html'
let replyEditorTemp = ejs.compile(replyEditorTempHtml)
import replyListTempHtml from '../../views/particles/replylist.html'
let replyListTemp = ejs.compile(replyListTempHtml)

const d = document
const list = d.getElementById('my-troubles')
const type = 'list'
list.addEventListener('click', async (e) => {
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
    let receiverId = el.dataset && el.dataset.ruid || el.getAttribute('data-ruid')
    let shown = (el.dataset && el.dataset.shown || el.getAttribute('data-shown')) === 'true'
    if (!shown) {
      el.closest('.bottom-bar').insertAdjacentHTML('afterend', replyEditorTemp({ 
        replyId, 
        parentId, 
        replyType, 
        parentType, 
        receiverId,
        refId: ''
      }))
      if (el.dataset) {
        el.dataset.shown = 'true'
      } else {
        el.getAttribute('data-shown', 'true') 
      }
    }
  } else if (el.matches('[rel-ctl="reply-cancel"]')) {
    let replyEditor = el.closest('.replyEditor')
    cancelReply(replyEditor)
  } else if (el.matches('[rel-ctl="reply-send"]')) {
    let replyId = el.dataset && el.dataset.id || el.getAttribute('data-id')
    let parentId = el.dataset && el.dataset.pid || el.getAttribute('data-pid')
    let replyType = el.dataset && el.dataset.type || el.getAttribute('data-type')
    let parentType = el.dataset && el.dataset.ptype || el.getAttribute('data-ptype')
    let receiverId = el.dataset && el.dataset.ruid || el.getAttribute('data-ruid')
    let replyEditor = el.closest('.replyEditor')
    let content = replyEditor.querySelector('textarea').value

    let replyList = null
    let troubleItem = replyEditor.parentNode
    if (replyType === 'reply') {
      replyList = replyEditor.closest('.reply-list')
    } else {
      replyList = troubleItem.querySelector('.reply-list')
    }
    cancelReply(replyEditor)

    let res = await post(`/${replyType}/${replyId}/reply`, { 
      content,
      parent_id: parentId,
      parent_type: parentType,
      receiver_id: receiverId
    })
    if (res.success) {
      let { user } = globalData
      let help = globalData.helps.find(item => item._id === parentId) || { 
        reply_count: 0,
        replies: []
      }
      help.reply_count += 1
      let { reply } = res
      reply.username = user.username
      if (replyType === 'reply') {
        let replyTo = help.replies.find(item => item._id === replyId)
        reply.receivername = replyTo.remark[0] || replyTo.username[0] || ''
      }
      help.replies.unshift(reply)
      replyList.innerHTML = replyListTemp({ help, user, type })
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

function cancelReply(replyEditor) {
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

import '@babel/polyfill'
import { get, del, post } from './lib/request'
import ejs from 'ejs'
// 其他组件引入
import classicEditor from './component/classiceditor'

if (globalData.user) {
  classicEditor.create()
}

// 组件开始
import recommendTempHtml from '../../views/particles/recommend.html'
let recommendTemp = ejs.compile(recommendTempHtml)

import remHelpSelectTempHtml from '../../views/particles/remhelpselect.html'
let remHelpSelectTemp = ejs.compile(remHelpSelectTempHtml)

import replyEditorTempHtml from '../../views/particles/replyeditor.html'
let replyEditorTemp = ejs.compile(replyEditorTempHtml)

import classicRefTempHtml from '../../views/particles/classicref.html'
let classicRefTemp = ejs.compile(classicRefTempHtml)

const d = document,
classicList = d.getElementById('classics')

classicList.addEventListener('click', async (e) => {
  let el = e.target
  while (el && el !== e.currentTarget) {
    if (el.matches('[rel-ctl="classic-remove"]')) {
      let hiding = ((el.dataset && el.dataset.hiding || el.getAttribute('data-hiding')) === 'true')
      if (!hiding) {
        let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
        let res = await del(`/classic/${id}`)
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
    } else if (el.matches('[rel-ctl="classic-recommend"]')) {
      let classicId = el.dataset && el.dataset.id || el.getAttribute('data-id')
      let shown = (el.dataset && el.dataset.shown || el.getAttribute('data-shown')) === 'true'
      const { features } = globalData
      if (!shown) {
        el.closest('.bottom-bar').insertAdjacentHTML('afterend', recommendTemp({ 
          features,
          classicId
        }))
        if (el.dataset) {
          el.dataset.shown = 'true'
        } else {
          el.getAttribute('data-shown', 'true') 
        }
      }
      return
    } else if (el.matches('[rel-ctl="recommend-to-help"]')) {
      let classicId = el.dataset && el.dataset.id || el.getAttribute('data-id')
      let shown = (el.dataset && el.dataset.shown || el.getAttribute('data-shown')) === 'true'
      if (!shown) {
        let res = await get(`/recommend/helps`)
        if (res) {
          let { success } = res
          if (success) {
            globalData.helps = res.helps
            el.closest('div').insertAdjacentHTML('afterend', remHelpSelectTemp({ 
              helps: res.helps,
              classicId,
              width: 480,
              noDataTips: globalData.noDataTips
            }))
            if (el.dataset) {
              el.dataset.shown = 'true'
            } else {
              el.getAttribute('data-shown', 'true') 
            }
          }
        }
        return
      }
    } else if (el.matches('[rel-ctl="help-select-recommend"]')) {
      let replyId = el.dataset && el.dataset.id || el.getAttribute('data-id')
      let classicId = el.dataset && el.dataset.cid || el.getAttribute('data-cid')
      let parentId = el.dataset && el.dataset.pid || el.getAttribute('data-pid')
      let replyType = el.dataset && el.dataset.type || el.getAttribute('data-type')
      let parentType = el.dataset && el.dataset.ptype || el.getAttribute('data-ptype')
      let popup = el.closest('.popup')
      popup.innerHTML = replyEditorTemp({ 
        replyId, 
        parentId, 
        replyType, 
        parentType, 
        refId: classicId
      })
      let classic = globalData.classics.find(c => (c._id === classicId))
      popup.querySelector('.refSource').innerHTML = classicRefTemp({ 
        classic
      })
      return
    } else if (el.matches('[rel-ctl="reply-send"]')) {
      let replyId = el.dataset && el.dataset.id || el.getAttribute('data-id')
      let parentId = el.dataset && el.dataset.pid || el.getAttribute('data-pid')
      let replyType = el.dataset && el.dataset.type || el.getAttribute('data-type')
      let parentType = el.dataset && el.dataset.ptype || el.getAttribute('data-ptype')
      let ref_id = el.dataset && el.dataset.rid || el.getAttribute('data-rid')
      let replyEditor = el.closest('.replyEditor')
      let content = replyEditor.querySelector('textarea').value
      let popup = el.closest('.popup')
      let res = await post(`/${replyType}/${replyId}/reply`, { 
        content,
        parent_id: parentId,
        parent_type: parentType,
        ref_id
      })
      if (res) {
        let { success } = res
        if (success) {
          popup.parentElement.removeChild(popup)
        }
      }
      return
    }
    el = el.parentElement
  }
}, false)
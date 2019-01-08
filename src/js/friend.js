import '@babel/polyfill'
import './lib/dom'
import { get, post, put, del } from './lib/request'
import ejs from 'ejs'

let userSearch = d.getElementById('userSearch'),
searchInput = userSearch.querySelector('input'),
searchButton = userSearch.querySelector('button')

let friendList = d.getElementById('friends')

import requestEditorTempHtml from '../../views/particles/friendrequest.html'
let requestEditorTemp = ejs.compile(requestEditorTempHtml)

import userListTempHtml from '../../views/particles/userlist.html'
let userListTemp = ejs.compile(userListTempHtml)
let userList = d.getElementById('users')

userList.addEventListener('click', async (e) => {
  let el = e.target
  if (el.matches('[rel-ctl="friend-add"]')) {
    let recipientId = el.dataset && el.dataset.id || el.getAttribute('data-id')
    el.insertAdjacentHTML('afterend', requestEditorTemp({ 
      recipientId, 
      status: 'add' 
    }))
  } else if (el.matches('[rel-ctl="request-send"]')) {
    let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
    let requestEditor = el.closest('.requestEditor')
    let res = await post(`/friend/${id}/send`, {
      content: requestEditor.querySelector('[name="content"]').value,
      remark: requestEditor.querySelector('[name="remark"]').value,
    })
  }
})

searchInput.addEventListener("keyup", function(event) {
  event.preventDefault()
  if (event.keyCode === 13) {
    searchButton.click()
  }
})

searchButton.addEventListener('click', async (e) => {
  let res = await get('/user/search', {
    username: searchInput.value.trim()
  })
  let { user } = globalData
  if (res.success) {
    userList.innerHTML = userListTemp(Object.assign(res, { user }))
  }
}, false)

friendList.addEventListener('click', async (e) => {
  let el = e.target
  if (el.matches('[rel-ctl="friend-accept"]')) {
    let recipientId = el.dataset && el.dataset.id || el.getAttribute('data-id')
    el.insertAdjacentHTML('afterend', requestEditorTemp({ 
      recipientId, 
      status: 'accept' 
    }))
  } else if (el.matches('[rel-ctl="friend-deny"]')) {
    let recipientId = el.dataset && el.dataset.id || el.getAttribute('data-id')
    el.insertAdjacentHTML('afterend', requestEditorTemp({ 
      recipientId, 
      status: 'deny' 
    }))
  } else if (el.matches('[rel-ctl="accept-confirm"]')) {
    let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
    let requestEditor = el.closest('.requestEditor')
    let res = await put(`/friend/${id}/accept`, {
      remark: requestEditor.querySelector('[name="remark"]').value
    })
  }  else if (el.matches('[rel-ctl="deny-confirm"]')) {
    let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
    let requestEditor = el.closest('.requestEditor')
    let res = await del(`/friend/${id}/remove`, {
      content: requestEditor.querySelector('[name="content"]').value
    })
  }  else if (el.matches('[rel-ctl="friend-remove"]')) {
    let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
    let res = await del(`/friend/${id}/remove`)
  }
})

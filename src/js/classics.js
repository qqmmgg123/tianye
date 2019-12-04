if (module.hot) {
  module.hot.accept();
}

import '@/js/common/global'
import '@/js/common/talktrouble'
import '@/sass/common/global.scss'
import '@/sass/classics.scss'
import autosize from 'autosize'
import { post } from '@/js/lib/request'
import { delegate, dispatchEvent } from '@/js/lib/utils'

// 关键词控制
let keywordList = document.querySelector('.keyword-list')
, showMore = document.querySelector('.show-more')
, isMoreShow = false
if (keywordList) {
  showMore.addEventListener('click', function() {
    if (!isMoreShow) {
      keywordList.style.display = ''
      showMore.querySelector('span').innerHTML = '收起'
      showMore.querySelector('i').style.transform = 'rotate(90deg)'
      isMoreShow = true
    } else {
      keywordList.style.display = 'none'
      showMore.querySelector('span').innerHTML = '内容类别'
      showMore.querySelector('i').style.transform = 'rotate(-90deg)'
      isMoreShow = false
    }
  })
}
/*
// 内省弹窗
let introspectionPop = document.querySelector('#introspection')
, question = document.querySelector('.question')
, knowledge = document.querySelector('.knowledge')
, worry = document.querySelector('.worry')
, singup = document.querySelector('.singup')
, knowledgeEditor = knowledge && knowledge.querySelector('textarea')
, worryEditor = worry && worry.querySelector('textarea')
, isAutoUser = document.cookie.indexOf("new_user=auto")

// 初始化
if (isAutoUser !== -1) {
  question.style.display = 'none'
  knowledge.style.display = 'none'
  worry.style.display = 'none'
  singup.style.display = ''
  // 以下删除cookie
  let date = new Date()
  date.setTime(date.getTime() - 1000)
  document.cookie = "new_user=auto; expires=" + date.toUTCString()
}

knowledgeEditor && autosize(knowledgeEditor)
worryEditor && autosize(worryEditor)
introspectionPop && delegate(introspectionPop, [
  '.icon-guanbi, .pass',
  '.good',
  '.bad',
  '.share',
  '.send'
], [
  function() {
    introspectionPop.style.display = 'none'
  },
  function() {
    question.style.display = 'none'
    knowledge.style.display = ''
  },
  function() {
    question.style.display = 'none'
    worry.style.display = ''
  },
  async function() {
    knowledge.style.display = 'none'
    let res = await post('/newmind', {
      type_id: 'share',
      column_id: 'sentence',
      content: knowledgeEditor && knowledgeEditor.value
    })
    if (res.success) {
      document.cookie = 'new_user=auto'
      location.reload()
    }
  },
  async function() {
    worry.style.display = 'none'
    let res = await post('/newmind', {
      type_id: 'help',
      column_id: 'sentence',
      content: worryEditor && worryEditor.value
    })
    if (res.success) {
      document.cookie = 'new_user=auto'
      location.reload()
    }
  }
]) */

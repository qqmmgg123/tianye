import '@babel/polyfill'
import ejs from 'ejs'
import './lib/dom'
import { put } from './lib/request'

// 其他组件引入
import classicEditor from './component/classiceditor'
classicEditor.create();

const classicForm = d.getElementById('classicForm')

classicForm.addEventListener('click', async (e) => {
  let el = e.target
  if (el.matches('button[type="submit"]')) {
    e.preventDefault()
    for (let field of classicForm.querySelectorAll('[name]')) {
      globalData.classic[field.name] = field.value
    }
    console.log(globalData.classic)
    let res = await put(`/classic/${globalData.classic._id}`, globalData.classic)
  }
}, false)

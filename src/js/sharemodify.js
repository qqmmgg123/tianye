import '@babel/polyfill'
import ejs from 'ejs'
import './lib/dom'
import { put } from './lib/request'

// 其他组件引入
import shareEditor from './component/shareeditor'
shareEditor.create()

const shareForm = d.getElementById('shareForm')

shareForm.addEventListener('click', async (e) => {
  let el = e.target
  if (el.matches('button[type="submit"]')) {
    e.preventDefault()
    for (let field of shareForm.querySelectorAll('[name]')) {
      globalData.share[field.name] = field.value
    }
    let res = await put(`/share/${globalData.share._id}`, globalData.share)
  }
}, false)

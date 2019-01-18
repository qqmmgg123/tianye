import '@babel/polyfill'
import ejs from 'ejs'
import './lib/dom'
import { put } from './lib/request'

// 其他组件引入
import classicEditor from './component/classiceditor'
classicEditor.create();

const sectionForm = d.getElementById('sectionForm')
const method = sectionForm.getAttribute('method')

if (method === 'put') {
  sectionForm.addEventListener('click', async (e) => {
    let el = e.target
    if (el.matches('button[type="submit"]')) {
      e.preventDefault()
      for (let field of sectionForm.querySelectorAll('[name]')) {
        globalData.section[field.name] = field.value
      }
      let path = `/section/${globalData.section._id}`
      let res = await put(path, globalData.section)
      if (res) {
        const { success } = res
        if (success) {
          window.location.href = path
        }
      }
    }
  }, false)
}

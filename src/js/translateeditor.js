import '@babel/polyfill'
import ejs from 'ejs'
import './lib/dom'
import { put } from './lib/request'

// 其他组件引入
import classicEditor from './component/classiceditor'
classicEditor.create();

const translateForm = d.getElementById('translateForm')
const method = translateForm.getAttribute('method')

if (method === 'put') {
  translateForm.addEventListener('click', async (e) => {
    let el = e.target
    if (el.matches('button[type="submit"]')) {
      e.preventDefault()
      for (let field of translateForm.querySelectorAll('[name]')) {
        globalData.translate[field.name] = field.value
      }
      let path = `/translate/${globalData.translate._id}`
      let res = await put(path, globalData.translate)
      if (res) {
        const { success } = res
        if (success) {
          window.location.href = path
        }
      }
    }
  }, false)
}

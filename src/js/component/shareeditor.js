import '@babel/polyfill'

// 组件开始
import shareEditorTempHtml from "../../../views/particles/shareeditor.html"

export default {
  create () {
    let { shareHolder, info, share = {} } = globalData
    let shareEditorTemp = ejs.compile(shareEditorTempHtml)
    const columnSelector = d.getElementById('columnSelector'),
    shareTypeSelector = d.getElementById('shareTypeSelector'),
    shareEditor = d.getElementById('shareEditor')

    columnSelector.addEventListener('click', (e) => {
      let el = e.target
      if (el.matches('[rel-ctl="column-select"]')) {
        let columnId = el.dataset && el.dataset.id || el.getAttribute('data-id')
        shareTypeSelector.value = columnId
        shareTypeSelector.dispatchEvent(new Event('change'))
      }
    }, false)

    // 创作类型选择
    shareTypeSelector.addEventListener('change', (e) => {
      let el = e.target
      let type = el.value
      share.column_id = type || ''
      shareEditor.innerHTML = shareEditorTemp({
        shareHolder,
        info,
        share
      })
      shareEditor.style.display = ''
    }, false)
  }
}

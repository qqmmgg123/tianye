import { del } from './lib/request'

const d = document
, sectionList = d.getElementById('sections')
, removeBtn   = d.querySelector('[rel-ctl="classic-remove"]')

console.log(removeBtn)
removeBtn && (removeBtn.onclick = function(e) { 
  e = window.event || e
  let el = e.srcElement || e.target
  , id = el.dataset && el.dataset.id || el.getAttribute('data-id')
  del(`/classic/${id}`)
  .then(function(res) {
    if (res) {
      let { success } = res
      if (success) {
        window.location.replace('/')
      }
    }
  })
})

sectionList && (sectionList.onclick = function(e) {
  e = window.event || e
  let el = e.srcElement || e.target
  if (el.matches('[rel-ctl="section-remove"]')) {
    let hiding = ((el.dataset && el.dataset.hiding || el.getAttribute('data-hiding')) === 'true')
    if (!hiding) {
      let id = el.dataset && el.dataset.id || el.getAttribute('data-id')
      del(`/section/${id}`)
      .then(function(res) {
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
      })
      .catch(err => {
        console.log(err)
      })
    }
  }
})
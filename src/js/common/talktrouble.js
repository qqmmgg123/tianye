import { showTroublePop } from '@/js/component/mindpopup'

// 诉说烦恼操作
const talkTroubleBtn = document.getElementById('talkTrouble')
talkTroubleBtn && talkTroubleBtn.addEventListener('click', (e) => {
  e = window.event || e
  if (e.preventDefault) {
    e.preventDefault()
  } else {
    e.returnValue = false
  }
  showTroublePop()
})

if (module.hot) {
  module.hot.accept();
}

import '@/js/common/global'
import '@/sass/common/global.scss'
import '@/sass/classics.scss'

let keywordList = document.querySelector('.keyword-list')
, showMore = document.querySelector('.show-more')
, isMoreShow = false
if (keywordList) {
  if (keywordList.offsetHeight > 88) {
    keywordList.style.height =  '88px'
    showMore.style.display = ''
  }
  showMore.addEventListener('click', function() {
    if (!isMoreShow) {
      keywordList.style.height = 'auto'
      showMore.querySelector('span').innerHTML = '点击收起'
      showMore.querySelector('i').style.transform = 'rotate(90deg)'
      isMoreShow = true
    } else {
      keywordList.style.height = '88px'
      showMore.querySelector('span').innerHTML = '点击展开更多'
      showMore.querySelector('i').style.transform = 'rotate(-90deg)'
      isMoreShow = false
    }
  })
}
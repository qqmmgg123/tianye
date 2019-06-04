(function(globalDataStr) {
  let navShow = false

  if (globalDataStr) {
    window.globalData = JSON.parse(decodeURIComponent(globalDataStr))
  }

  const navBar = document.querySelector('nav')
  document.querySelector('.icon-caidan').addEventListener('click', () => {
    if (!navShow) {
      navBar.className = 'show'
      navShow = true
    } else {
      navBar.className = 'hide'
      navShow = false
    }
  }, false)
})(globalDataStr)
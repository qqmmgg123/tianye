(function(globalDataStr) {
  let navShow = false

  if (globalDataStr) {
    window.globalData = JSON.parse(decodeURIComponent(globalDataStr))
  }

  const navBar = document.querySelector('nav')
  document.querySelector('.icon-caidan').addEventListener('click', () => {
    if (!navShow) {
      navBar.style.display = 'flex'
      navShow = true
    } else {
      navBar.style.display = 'none'
      navShow = false
    }
  }, false)
})(globalDataStr)
(function(globalDataStr) {
  if (globalDataStr) {
    window.globalData = JSON.parse(decodeURIComponent(globalDataStr))
  }
})(globalDataStr)
(function(globalDataStr) {
  let navShow = false
  // , version = checkVersion();

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

  /* let footer = document.querySelector('.footer')
  , main = document.querySelector('.main');
  if (version.android || version.ios) {
    footer.display = 'block'
    main.className = 'main mobile' 
  } */

  /* function checkVersion() {
    var ua = window.navigator.userAgent.toLowerCase();
    var version = {
        "ios" : ua.indexOf("iphone") > -1,
        "android" : ua.indexOf("android") > -1 || ua.indexOf("linux") > -1,
        "safari" : ua.indexOf("iphone") > -1,
        "weixin" : (ua.match(/MicroMessenger/i) == 'micromessenger')
    };
    return version;
  } */
})(globalDataStr)
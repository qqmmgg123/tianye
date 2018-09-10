const gulp = require('gulp')
const browserSync = require('browser-sync').create()

gulp.task("watch", function () {
  browserSync.init({
    /*这里的files写的是需要监控的文件的位置*/
    files: [
      './views/*.html',
    ],
    logLevel: "debug",
    logPrefix: "insgeek",
    /*这里的proxy写的是需要代理的服务器，我自己的wamp启动的是localhost:80*/
    proxy: "127.0.0.1:3000",
    ghostMode: {
      clicks: true,
      forms: true,
      scroll: true
    },
    /*这里写的是代理后，bs在哪个端口打开*/
    port: 8080,
    /*这里设置的是bs运行时打开的浏览器名称*/
    browser: "chrome"
  })
})
const gulp = require('gulp')
const browserify = require('browserify')
const webpack = require('webpack');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserSync = require('browser-sync').create()
const plumber = require('gulp-plumber')
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const watch = require('gulp-watch');
const uglify = require('gulp-uglify');
const path = require('path');
const runSequence = require('run-sequence');
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.config.js');

gulp.task('js', () => {
  gulp.src('./src/js/index.js')
    .pipe(webpackStream(webpackConfig), webpack)
    .pipe(gulp.dest('./dist/js'));
});

let currentFileName = ''

function scripts(filename) {
  return () => {
    return browserify(`src/js/${filename}`)
      .transform('babelify')
      .bundle()
      .pipe(source(filename))
      .pipe(buffer())
      .pipe(gulp.dest('dist/js'))
      .pipe(browserSync.stream())
      // .on('end', browserSync.reload)
  }
}

/*function scripts(filename) {
  return () => {
    return gulp.src(`src/js/${filename}`)
      .pipe(webpackStream(webpackConfig), webpack)
      .pipe(gulp.dest('./dist/js'))
      .pipe(browserSync.stream())
  }
}*/

gulp.task('scripts', scripts('classic.js'))

gulp.task('sass', () => {
  return gulp.src('src/sass/*.scss')
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream())
})

gulp.task("serve", (done) => {
  browserSync.init({
    files: [
      //'views/*.html',
      'views/**/*.html'
    ],
    server: false,
    proxy: "localhost:3000",
    port: 8080,
    browser: "firefox"
  }, done)
})

gulp.task('watch:sass', () => {
  return gulp.watch('./src/sass/*.scss', gulp.series('sass'))
})

gulp.task('watch:es6', () => {
  return watch('./src/js/*.js', (file) => {
    const name = path.basename(file.path)
    scripts(name)()
  })
})

gulp.task('watch', gulp.parallel('watch:es6', 'watch:sass'))

gulp.task('default', gulp.series('scripts', 'serve', 'watch'))

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
const glob = require('glob');
const es = require('event-stream');

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

function scss(filename) {
  return () => {
    return gulp.src(`src/sass/${filename}`)
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(gulp.dest('dist/css'))
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

gulp.task('scripts', (done) => {
  glob('src/js/*.js', function(err, files) {
    if (err) done(err);
    let tasks = files.map((entry) => {
      return browserify(entry)
      .transform('babelify')
      .bundle()
      .pipe(source(path.basename(entry)))
      .pipe(buffer())
      .pipe(gulp.dest('dist/js'));
    })
    es.merge(tasks).on('end', done);
  })
})

gulp.task('scss', (done) => {
  return gulp.src('src/sass/*.scss')
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(gulp.dest('dist/css'))
    .on('end', done)
})

gulp.task("serve", (done) => {
  browserSync.init({
    files: [
      'views/**/*.html'
    ],
    server: false,
    proxy: "localhost:3000",
    port: 8080,
    browser: "firefox"
  }, done)
})

gulp.task('watch:scss', () => {
  return watch('./src/sass/*.scss', (file) => {
    const name = path.basename(file.path)
    scss(name)()
  })
})

gulp.task('watch:es6', () => {
  return watch('./src/js/*.js', (file) => {
    const name = path.basename(file.path)
    scripts(name)()
  })
})

gulp.task('watch', gulp.parallel('watch:es6', 'watch:scss'))

gulp.task('default', gulp.series('scripts', 'scss', 'serve', 'watch'))

gulp.task('build', gulp.series('scripts', 'scss'))

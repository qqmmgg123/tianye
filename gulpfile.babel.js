const gulp = require('gulp')
const browserify = require('browserify')
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserSync = require('browser-sync').create()
const plumber = require('gulp-plumber')
const sass = require('gulp-sass');
const watch = require('gulp-watch');
const uglify = require('gulp-uglify');
const path = require('path');
const glob = require('glob');
const es = require('event-stream');
const sourcemaps = require('gulp-sourcemaps');

//引入PostCss
const postcss = require('gulp-postcss');
const bem = require('postcss-bem');
const cssNext = require('postcss-cssnext');
const px2rem = require('postcss-px2rem');//px转换成rem
const autoprefixer = require('autoprefixer-core');
const postcssSimpleVars = require("postcss-simple-vars");
const postcssMixins = require("postcss-mixins");
const postcssNested = require("postcss-nested");

function scripts(filename) {
  return () => {
    return browserify(`src/js/${filename}`)
      .transform('babelify')
      .bundle()
      .pipe(source(filename))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('dist/js'))
      .pipe(browserSync.stream())
      // .on('end', browserSync.reload)
  }
}

function scss(filename) {
  let processors = [
    postcssMixins,
    postcssSimpleVars,
    postcssNested,
    cssNext,
    bem({style: 'bem'}),
    px2rem({
      remUnit: 32
    }),
    autoprefixer({
      browsers: ["Android 4.1", "iOS 7.1", "Chrome > 31", "ff > 31", "ie >= 10"]
    })];

    /*return gulp.src(['./css/*.css'])
      .pipe(sourcemaps.init())
      .pipe(postcss(processors))
      .pipe(sourcemaps.write("."))
      .pipe(gulp.dest("./stylesheets"));*/

  return () => {
    return gulp.src(`src/sass/${filename}`)
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(postcss(processors))
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
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('dist/js'));
    })
    es.merge(tasks).on('end', done);
  })
})

gulp.task('scss', (done) => {
  let processors = [
    postcssMixins,
    postcssSimpleVars,
    postcssNested,
    cssNext,
    bem({style: 'bem'}),
    // px2rem({
      // remUnit: 32
    // }),
    autoprefixer({
      browsers: ["Android 4.1", "iOS 7.1", "Chrome > 31", "ff > 31", "ie >= 10"]
    })];

  return gulp.src('src/sass/*.scss')
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(postcss(processors))
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

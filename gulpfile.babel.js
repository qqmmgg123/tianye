const gulp = require('gulp')
const fs = require('fs')
const browserify = require('browserify')
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserSync = require('browser-sync').create()
const plumber = require('gulp-plumber')
const sass = require('gulp-sass');
const watch = require('gulp-watch');
const uglify = require('gulp-uglify');
const replace = require('gulp-replace');
const path = require('path');
const glob = require('glob');
const es = require('event-stream');
const sourcemaps = require('gulp-sourcemaps');

//引入PostCss
const postcss = require('gulp-postcss');
const bem = require('postcss-bem');
const cssNext = require('postcss-cssnext')
const px2rem = require('postcss-pxtorem')
const postcssSimpleVars = require("postcss-simple-vars");
const postcssMixins = require("postcss-mixins");
const postcssNested = require("postcss-nested");

// 处理js文件
function scripts(filename) {
  return () => {
    return browserify(`src/js/${filename}`)
      .transform('babelify')
      .bundle()
      .pipe(source(filename))
      .pipe(buffer())
      .pipe(plumber())
      .pipe(uglify())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('dist/js'))
      .pipe(browserSync.stream())
  }
}

// 处理css文件
function scss(filename) {
  let processors = [
    postcssMixins,
    postcssSimpleVars,
    postcssNested,
    cssNext,
    bem({style: 'bem'}),
    /* px2rem({
      rootValue : 32,
      propList   : ['*'],
    }), */
  ]

  return () => {
    return gulp.src(`src/sass/${filename}`)
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(postcss(processors))
    .pipe(gulp.dest('dist/css'))
    .on('end', () => {
      if (filename === 'index.scss') {
        style()()
      } else {
        browserSync.reload()
      }
    })
  }
}

// 替换成内联style
function style() {
  return () => {
    return gulp.src('src/template/index.html')
      .pipe(replace(/<link href="\/static\/css\/index.css"[^>]*>/, function(s) {
          var style = fs.readFileSync(__dirname + '/dist/css/index.css', 'utf8');
          return '<style>\n' + style + '\n</style>';
      }))
      .pipe(gulp.dest('views'))
      .pipe(browserSync.stream())
  }
}

// 处理所有js文件
gulp.task('scripts', (done) => {
  glob('src/js/*.js', function(err, files) {
    if (err) done(err);
    let tasks = files.map((entry) => {
      return browserify(entry)
      .transform('babelify')
      .bundle()
      .pipe(source(path.basename(entry)))
      .pipe(buffer())
      .pipe(plumber())
      .pipe(uglify())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('dist/js'));
    })
    es.merge(tasks).on('end', done);
  })
})

// 处理所有css文件
gulp.task('scss', (done) => {
  let processors = [
    postcssMixins,
    postcssSimpleVars,
    postcssNested,
    cssNext,
    bem({style: 'bem'}),
    /* px2rem({
      rootValue : 32,
      propList   : ['*'],
    }), */
  ]

  return gulp.src('src/sass/*.scss')
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(postcss(processors))
    .pipe(gulp.dest('dist/css'))
    .on('end', done)
})

// 启动browserSync代理服务
gulp.task("serve", (done) => {
  browserSync.init({
    files: [
      {
        match: ['src/template/*.html'],
        fn: (event, file) => {
          console.log(file === 'src/template/index.html')
          if (file === 'src/template/index.html') {
            console.log('......')
            style()()
          }
        }
      }
    ],
    server: false,
    proxy: "localhost:3000",
    port: 8080,
    browser: "google chrome"
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

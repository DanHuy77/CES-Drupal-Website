const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCss = require('gulp-clean-css');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const pxtorem = require('postcss-pxtorem');
const rename = require('gulp-rename');

const postcssProcessors = [
  pxtorem({
    propList: ['font-size', 'line-height', 'letter-spacing', '*margin*', '*padding*'],
    mediaQuery: true
  })
];

const paths = {
  scss: {
    src: './scss/style.scss',
    dest: './css',
    watch: './scss/**/*.scss'
  },
  js: {
    bootstrap: './node_modules/bootstrap/dist/js/bootstrap.min.js',
    dest: './js'
  }
};

// Compile sass into CSS & auto-inject into browsers
function styles() {
  return gulp
    .src([paths.scss.src])
    .pipe(
      sass({
        includePaths: ['./node_modules/bootstrap/scss']
      }).on('error', sass.logError)
    )
    .pipe(postcss(postcssProcessors))
    .pipe(
      postcss([
        autoprefixer({
          overrideBrowserslist: [
            'Chrome >= 35',
            'Firefox >= 38',
            'Edge >= 12',
            'Explorer >= 10',
            'iOS >= 8',
            'Safari >= 8',
            'Android 2.3',
            'Android >= 4',
            'Opera >= 12'
          ]
        })
      ])
    )
    .pipe(
      cleanCss({
        level: { 1: { specialComments: 0 }, 2: { removeDuplicateRules: true } }
      })
    )
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.scss.dest))
    .pipe(browserSync.stream());
}

// Move the javascript files into our js folder
function js() {
  return gulp.src([paths.js.bootstrap]).pipe(gulp.dest(paths.js.dest)).pipe(browserSync.stream());
}

// Watching scss/html files
function serve() {
  gulp.watch([paths.scss.watch], styles);
}

const build = gulp.series(styles, gulp.parallel(js, serve));
const buildNoWatch = gulp.series(styles, js);
exports.buildNoWatch = buildNoWatch;
exports.styles = styles;
exports.js = js;
exports.serve = serve;

exports.default = build;

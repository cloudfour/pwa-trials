'use strict';

const data = require('gulp-data');
const fs = require('fs');
const gulp = require('gulp');
const handlebars = require('gulp-compile-handlebars')
const postcss = require('gulp-postcss');
const rev = require('gulp-rev');
const revhash = require('rev-hash');
const tasks = require('@cloudfour/gulp-tasks');
const maybeVal = (map, key) => map[key] || key;

tasks.clean(gulp);

gulp.task('css', () => gulp.src('src/assets/*.css')
  .pipe(postcss([
    require('postcss-import'),
    require('postcss-cssnext')
  ]))
  .pipe(gulp.dest('dist/assets'))
);

gulp.task('js', ['sw'], () => gulp.src('src/assets/*.js')
  .pipe(gulp.dest('dist/assets'))
);


gulp.task('img', () => gulp.src(['blank.png', 'src/assets/*.{png,gif,jpg,svg}'])
  .pipe(gulp.dest('dist'))
);

gulp.task('sw', () => gulp.src('sw.js')
  .pipe(gulp.dest('dist'))
);

gulp.task('rev', ['css', 'js'], () => gulp.src('dist/assets/main.{css,js}', {base: 'dist'})
  .pipe(rev())
  .pipe(gulp.dest('dist'))
  .pipe(rev.manifest())
  .pipe(gulp.dest('dist'))
);

gulp.task('html', ['rev'], () => gulp.src('{*,offline/*}.html')
  .pipe(data(file => {
    const manifest = fs.readFileSync('./dist/rev-manifest.json');
    return {
      assetMap: JSON.parse(manifest.toString())
    };
  }))
  .pipe(handlebars({}, {
    helpers: {
      assetPath: (file, context) => {
        return maybeVal(context.data.root.assetMap, file);
      }
    }
  }))
  .pipe(gulp.dest('dist'))
);

gulp.task('default', ['html', 'img'], done => done())

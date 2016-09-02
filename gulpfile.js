'use strict';

const tasks = require('@cloudfour/gulp-tasks');
const cssnext = require('postcss-cssnext');
const gulp = require('gulp');
const importer = require('postcss-import');
const postcss = require('gulp-postcss');
const replace = require('gulp-replace');
const rev = require('gulp-rev');
const streamqueue = require('streamqueue');
const {version} = require('./package.json');

tasks.clean(gulp);

gulp.task('css', () => gulp.src('src/assets/*.css')
  .pipe(postcss([importer, cssnext]))
  .pipe(gulp.dest('dist/assets'))
);

gulp.task('js', () => gulp.src('src/assets/*.js')
  .pipe(gulp.dest('dist/assets'))
);

gulp.task('html', () => gulp.src('*.html')
  .pipe(gulp.dest('dist'))
);

// gulp.task('rev', ['css', 'js'], () => gulp.src('dist/assets/*')
//   .pipe(rev())
//   .pipe(gulp.dest('dist/assets'))
//   .pipe(rev.manifest({merge: true}))
//   .pipe(gulp.dest('dist'))
// );

gulp.task('sw', () => gulp.src(['sw.js', 'rev-manifest.json'])
  .pipe(replace('__VERSION__', version))
  .pipe(gulp.dest('dist'))
);

gulp.task('default', ['css', 'js', 'html', 'sw'], done => done())

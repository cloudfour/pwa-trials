'use strict';

const del = require('del');
const gulp = require('gulp');
const postcss = require('gulp-postcss');
const posthtml = require('gulp-posthtml');

gulp.task('html', () => {
  const plugins = [
    require('posthtml-include')({
      encoding: 'utf8',
      root: './src/html/includes/'
    })
  ];
  return gulp.src('src/html/*.html')
    .pipe(posthtml(plugins))
    .pipe(gulp.dest('dist'));
});

gulp.task('css', () => {
  const plugins = [
    require('postcss-import'),
    require('postcss-cssnext')
  ];
  return gulp.src('src/assets/*.css')
    .pipe(postcss(plugins))
    .pipe(gulp.dest('dist/assets'));
});

gulp.task('js', () => {
  return gulp.src('src/assets/*.js')
    .pipe(gulp.dest('dist/assets'));
});

gulp.task('workers', ['manifest'], () => {
  return gulp.src('src/js/workers/*.js')
    .pipe(gulp.dest('dist'));
});

gulp.task('manifest', () => {
  return gulp.src('src/manifest.json')
    .pipe(gulp.dest('dist'));
});

gulp.task('img', () => {
  return gulp.src('src/assets/*.{png,gif,jpg,svg}')
    .pipe(gulp.dest('dist/assets'));
});

gulp.task('static', () => {
  return gulp.src('static/*')
    .pipe(gulp.dest('dist/static'));
});

gulp.task('clean', () => del('dist/'));

gulp.task('watch', done => {
  gulp.watch('src/**/*.js', ['js', 'workers']);
  gulp.watch('src/**/*.css', ['css']);
  gulp.watch('src/html/**/*', ['html']);
  done();
});

gulp.task('build', ['html', 'css', 'js', 'workers', 'img', 'static']);

gulp.task('default', ['build']);

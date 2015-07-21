var gulp = require('gulp');

var download = require('gulp-download');
var unzip = require('gulp-unzip');
var clean = require('gulp-clean');

var fs = require('fs');
var hasFile = fs.existsSync;

var config = {
  themeName: 'default',
  latestWordpressURL: 'https://wordpress.org/latest.zip'
};

gulp.task('install', ['download', 'unzip', 'rename', 'delete']);

gulp.task('download', function() {
  var url = config.latestWordpressURL;

  return download(url).pipe(gulp.dest(__dirname + '/tmp'));
});

gulp.task('unzip', ['download'], function() {
  return gulp.src(__dirname + '/tmp/latest.zip').pipe(unzip()).pipe(gulp.dest(__dirname));
});

gulp.task('rename', ['unzip'], function() {
  return gulp.src(__dirname + '/wordpress/**/*').pipe(gulp.dest(__dirname + '/public'));
});

gulp.task('delete', ['rename'], function() {
  return gulp.src([__dirname + '/wordpress', __dirname + '/tmp']).pipe(clean());
});

gulp.task('clean', function() {
  return gulp.src([
    __dirname + '/public',
    __dirname + '/wordpress',
    __dirname + '/tmp'
  ]).pipe(clean());
});

gulp.task('installIfNecessary', function(callback) {
  var alreadyInstalled = hasFile(__dirname + '/public');

  if (!alreadyInstalled) {
    return gulp.start('install');
  } else {
    return callback();
  }
});

gulp.task('compile', ['installIfNecessary'], function() {
  console.log('done');
});

gulp.task('default', ['installIfNecessary', 'compile']);
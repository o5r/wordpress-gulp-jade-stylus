/**
 * This Gulp script generates Wordpress themes using Jade + Stylus
 *
 * TODO:
 * + Install Wordpress only if it hasn't been installed yet
 * + Add an images folder and compress before copying using gulp-imagemin
 */

var fs = require('fs');
var _ = require('lodash');
var server = require('browser-sync').create();

var gulp = require('gulp');
var download = require('gulp-download');
var unzip = require('gulp-unzip');
var jade = require('gulp-jade-php');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap');
var gulpif = require('gulp-if');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var order = require('gulp-order');
var plumber = require('gulp-plumber');
var minifyCSS = require('gulp-minify-css');

var nib = require('nib');
var del = require('del');

var hasFile = fs.existsSync;
var utils = require('./utils');

/**
 * Configuration object, following this priority:
 * 1°) the default parameters
 * 2°) the config.json file at the root
 * 3°) the arguments
 */

var config = _.extend({
  latestWordpressURL: 'https://wordpress.org/latest.zip',
  production: false,
  locals: {},
  server: {
    logPrefix: 'Server',
    proxy: 'local.wordpress.com',
    port: 8080,
    open: false,
    notify: false
  }
}, require('./config.json'), require('yargs').argv);


/**
 * The assets paths
 */

var paths = {
  root: 'themes/' + config.theme,
  config: 'themes/' + config.theme + '/config.json',
  stylesheets: 'themes/' + config.theme + '/stylesheets',
  javascripts: 'themes/' + config.theme + '/javascripts/**/*.js',
  templates: 'themes/' + config.theme + '/templates/**/*.jade',
  destination: 'public/wp-content/themes/' + config.theme
};

paths.misc = [
  '!' + paths.root + '/{templates,javascripts,stylesheets}/**/*',
  '!' + paths.root + '/{templates,javascripts,stylesheets,config.json}',
  paths.root + '/**/*'
];

/**
 * Creates the `public` folder from unzipping the latest Wordpress release
 */

gulp.task('install', ['download', 'unzip', 'rename', 'delete']);

gulp.task('next', ['download'], function() {
  console.log('nexto');
});

/**
 * Downloads the latest Wordpress release
 */

gulp.task('download', function() {
  return download(config.latestWordpressURL).pipe(gulp.dest(__dirname + '/tmp'));
});

/**
 * Unzips the latest release to the current directory
 */

gulp.task('unzip', ['download'], function() {
  return gulp.src(__dirname + '/tmp/latest.zip')
             .pipe(unzip())
             .pipe(gulp.dest(__dirname));
});

/**
 * Copies all the files in the `wordpress` folder to a `public` folder
 */

gulp.task('rename', ['unzip'], function() {
  return gulp.src(__dirname + '/wordpress/**/*')
             .pipe(gulp.dest(__dirname + '/public'));
});

/**
 * Deletes the previously created `wordpress` folder
 */

gulp.task('delete', ['rename'], function(callback) {
  return del([
    __dirname + '/wordpress',
    __dirname + '/tmp'
  ], callback);
});

/**
 * Compiles all the javascripts files into a core.js file
 * If we're running this in production, minifies the file
 */

gulp.task('compileJavascripts', function() {
  var fileName = 'core.js';

  return gulp.src(paths.javascripts)
             .pipe(plumber())
             .pipe(order([ 'jquery.js' ]))
             .pipe(concat(fileName))
             .pipe(gulpif(config.production, uglify({compress: false})))
             .pipe(gulp.dest(paths.destination))
             .pipe(gulpif(!config.production, server.stream()));
});

/**
 * Compiles the Stylus style.styl file into a style.css file at the theme's root
 * Also appends the config.json file at the top of the style.css, based on the
 * css-template.txt file
 */

gulp.task('compileStylesheets', function() {
  var configPath = __dirname + '/' + paths.config;
  var themeMeta = false;

  if (hasFile(configPath)) {
    themeMeta = utils.parseConfigFile(require(configPath));
  }

  return gulp.src(paths.stylesheets + '/style.styl')
             .pipe(plumber())
             .pipe(stylus({ use: [nib()] }))
             .pipe(gulpif(!!themeMeta, wrap({ src: __dirname + '/css-template.txt'}, { meta: themeMeta })))
             .pipe(gulpif(config.production, minifyCSS()))
             .pipe(gulp.dest(paths.destination))
             .pipe(gulpif(!config.production, server.stream()));
});

/**
 * Compiles Jade templates into theme directory
 */

gulp.task('compileTemplates', function() {
  return gulp.src(paths.templates)
             .pipe(plumber())
             .pipe(jade({ locals: config.locals }))
             .pipe(gulp.dest(paths.destination))
             .pipe(gulpif(!config.production, server.stream()));
});

/**
 * Copy all the files in themes that are not in the
 * templates/javascripts/stylesheets folders or the config.json file
 */

gulp.task('compileMisc', function() {
  return gulp.src(paths.misc)
             .pipe(gulp.dest(paths.destination));
});

/**
 * Compiles all the assets
 */

gulp.task('compile', function() {
  var tasks = ['compileTemplates', 'compileStylesheets', 'compileJavascripts', 'compileMisc'];

  if (!hasFile(__dirname + '/public')) {
    tasks.unshift('install');
  }

  return gulp.start(tasks);
});

/**
 * Watch all the assets
 */

gulp.task('watch', function() {
  gulp.watch([paths.stylesheets + '/**/*.styl', paths.config], ['compileStylesheets']);
  gulp.watch([paths.templates], ['compileTemplates']);
  gulp.watch([paths.javascripts], ['compileJavascripts']);
});

/**
 * Starts the live-reloaded web server
 */

gulp.task('live-reload', function() {
  return server.init(config.server);
});

/**
 * Cleans everything by deleting newly created folders
 */

gulp.task('clean', function(callback) {
  return del([
    __dirname + '/public',
    __dirname + '/wordpress',
    __dirname + '/tmp'
  ], callback);
});

/**
 * Compiles then watch assets if not in production
 */

gulp.task('default', ['compile'], function() {
  if (!config.production) {
    gulp.start('watch');
    if (!!config.server) {
      gulp.start('live-reload');
    }
  }
});
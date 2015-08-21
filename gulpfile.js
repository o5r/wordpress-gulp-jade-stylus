/**
 * This Gulp script generates Wordpress themes using Jade + Stylus
 *
 * TODO:
 * + Install Wordpress only if it hasn't been installed yet
 * + Compile style.css using config.json + utils.parseConfigFile
 * + Compile templates + js + css into theme root path (not subdirectories)
 * + Uglify JS if compiling for production
 * + Put paths into a global config object
 * + Add an images folder and compress before copying using gulp-imagemin
 */

var gulp = require('gulp');
var fs = require('fs');
var _ = require('lodash');

var download = require('gulp-download');
var unzip = require('gulp-unzip');
var clean = require('gulp-clean');
var jade = require('gulp-jade-php');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap');
var gulpif = require('gulp-if');
var nib = require('nib');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var order = require('gulp-order');
var debug = require('gulp-debug');
var minifyCSS = require('gulp-minify-css');

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
  production: false
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
  '!' + paths.root + '/{templates,javascripts,stylesheets}/**',
  '!' + paths.root + '/{templates,javascripts,stylesheets,config.json}',
  paths.root + '/**'
];

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
    return gulp.start('install', function() {
      console.log('done installing');
    });
  } else {
    return callback();
  }
});

/**
 * Compiles all the javascripts files into a core.js file
 * If we're running this in production, minifies the file
 */

gulp.task('compileJavascripts', function() {
  var fileName = 'core.js';

  return gulp.src(paths.javascripts)
             .pipe(order([ 'jquery.js' ]))
             .pipe(concat(fileName))
             .pipe(gulpif(config.production, uglify({compress: false})))
             .pipe(gulp.dest(paths.destination));
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
             .pipe(stylus({ use: [nib()] }))
             .pipe(gulpif(!!themeMeta, wrap({ src: __dirname + '/css-template.txt'}, { meta: themeMeta })))
             .pipe(gulpif(config.production, minifyCSS()))
             .pipe(gulp.dest(paths.destination));
});

/**
 * Compiles Jade templates into theme directory
 */

gulp.task('compileTemplates', function() {
  return gulp.src(paths.templates)
             .pipe(jade({ locals: config.locals }))
             .pipe(gulp.dest(paths.destination));
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

gulp.task('compile', ['compileTemplates', 'compileStylesheets', 'compileJavascripts', 'compileMisc']);

/**
 * Watch all the assets
 */

gulp.task('watch', function() {
  gulp.watch([paths.stylesheets + '/**/*.styl', paths.config], ['compileStylesheets'])
  gulp.watch([paths.templates], ['compileTemplates']);
  gulp.watch([paths.misc], ['compileMisc']);
  gulp.watch([paths.javascripts], ['compileJavascripts']);
});

/**
 * Compiles then watch assets if not in production
 */

gulp.task('default', ['compile'], function() {
  if (!config.production) {
    gulp.start('startLiveReload');
    gulp.start('watch');
  }
});
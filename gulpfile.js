/** 
 * This Gulp script generates Wordpress themes using Jade + Stylus 
 * + support gulp 4.0.2, node 12.13.0 LTS
 * + Install Wordpress only if it hasn't been installed yet 
 */ 

const fs = require('fs');
const _ = require('lodash');

const gulp = require('gulp');
const download = require('gulp-download');
const unzip = require('gulp-unzip');
const jade = require('gulp-jade-php');
const concat = require('gulp-concat');
const wrap = require('gulp-wrap');
const gulpif = require('gulp-if');
const stylus = require('gulp-stylus');
const uglify = require('gulp-uglify');
const order = require('gulp-order');
const plumber = require('gulp-plumber');
const minifyCSS = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cached');
const pot = require('gulp-wp-pot');
const sort = require('gulp-sort');
const replace = require('gulp-replace');
const gettext = require('gulp-gettext');
const sourcemaps = require('gulp-sourcemaps');

const nib = require('nib');
const jeet = require('jeet');

const del = require('del');

const hasFile = fs.existsSync;
const utils = require('./utils');

/**
 * Configuration object, following this priority:
 * 1°) the default parameters
 * 2°) the config.json file at the root
 * 3°) the arguments
 */
const config = _.merge({
  latestWordpressURL: 'https://wordpress.org/latest.zip',
  production: false,
  locals: {
    version: Date.now()
    },
  server: {
    open: false,
    notify: false
    },
  rename: false // rename the theme name
  },
  require('./config.json'),
  require('yargs').argv
);

if (_.isUndefined(config.domain) && !_.isUndefined(config.theme)) {
  config.domain = _.kebabCase(config.theme);
  config.server.logPrefix = config.theme;
}

/**
 * Configuring browser-sync
 * This is obviously ugly because we don't install browser-sync in production
 */
let server;
if (config.production) {
  server = {
    stream: function() {
      return true;
    }
  };
} else {
  server = require('browser-sync').create();
}

/**
 * The assets paths
 */
const paths = {
  root: 'themes/' + config.theme,
  config: 'themes/' + config.theme + '/config.json',
  stylesheets: 'themes/' + config.theme + '/stylesheets',
  languages: 'themes/' + config.theme + '/languages/*.po',
  javascripts: 'themes/' + config.theme + '/javascripts/**/*.js',
  templates: 'themes/' + config.theme + '/templates/**/*.jade',
  images: 'themes/' + config.theme + '/images/**/*',
  functions: 'themes/' + config.theme + '/functions.php',
  destination: 'public/wp-content/themes/' + config.theme,
  misc: [
    'themes/' + config.theme + '/**/*',
    '!themes/' + config.theme + '/{templates,javascripts,stylesheets,languages,images}/**/*',
    '!themes/' + config.theme + '/{templates,javascripts,stylesheets,languages,images,config.json,functions.php}'
  ]
};

/**
 * Creates the `public` folder from unzipping the latest Wordpress release
 */

/**
 * Downloads the latest Wordpress release
 */
gulp.task('download', function() {
  return download(config.latestWordpressURL).pipe(gulp.dest(__dirname + '/tmp'));
});

/**
 * Unzips the latest release to the current directory
 */
gulp.task('unzip', function() {
  return gulp.src(__dirname + '/tmp/latest.zip')
             .pipe(unzip())
             .pipe(gulp.dest(__dirname));
});

/**
 * Copies all the files in the `wordpress` folder to a `public` folder
 */
gulp.task('rename', function() {
  return gulp.src(__dirname + '/wordpress/**/*')
             .pipe(gulp.dest(__dirname + '/public'));
});

/**
 * Deletes the previously created `wordpress` folder
 */
gulp.task('delete', function(callback) {
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
  const fileName = 'core.js';

  return gulp.src(paths.javascripts)
             .pipe(plumber())
             .pipe(order([ 'jquery.js' ]))
             .pipe(cache('core'))
             .pipe(sourcemaps.init({loadMaps: true}))
               .pipe(babel({
                 presets: [['env', { targets: { ie: 9 } }]]
               }))
               .pipe(concat(fileName))
               .pipe(gulpif(config.production, uglify({compress: false})))
             .pipe(sourcemaps.write('./'))
             .pipe(remember('core'))
             .pipe(gulp.dest(paths.destination))
             .pipe(gulpif(!config.production, server.stream()));
});

/**
 * Compiles the Stylus style.styl file into a style.css file at the theme's root
 * Also appends the config.json file at the top of the style.css, based on the
 * css-template.txt file
 */
gulp.task('compileStylesheets', function() {
  const configPath = __dirname + '/' + paths.config;
  let themeMeta = false;

  if (hasFile(configPath)) {
    const json = require(configPath);

    if (_.isUndefined(json['text-domain'])) {
      json['text-domain'] = config.domain;
    }
    if (!_.isUndefined(config.headers)) {
      _.merge(json, config.headers);
    }
    themeMeta = utils.parseConfigFile(json);
  }

  return gulp.src(paths.stylesheets + '/style.styl')
             .pipe(plumber())
             .pipe(stylus({ use: [nib(), jeet()] }))
             .pipe(gulpif(config.production, minifyCSS()))
             .pipe(gulpif(!!themeMeta, wrap({ src: __dirname + '/css-template.txt'}, { meta: themeMeta })))
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
 * Analyzes PHP files and generates a POT file
 */
gulp.task('compilePOT', function() {
  const configPath = __dirname + '/' + paths.config;
  const potConfig = {
    domain: '$text_domain'
  };

  if (hasFile(configPath)) {
    const json = require(configPath);

    if (!_.isUndefined(json['author-uri'])) {
      potConfig.bugReport = json['author-uri'];
    }
    if (!_.isUndefined(json['author'])) {
      potConfig.team = json['author'];
    }
  }

  return gulp.src(paths.destination + '/**/*.php')
             .pipe(pot(potConfig))
             .pipe(gulp.dest(paths.destination + '/languages/' + config.domain + '.pot'))
             .pipe(gulp.dest(paths.root + '/languages/' + config.domain + '.pot'));
});

/**
 * Compiles PO files into MO files
 */
gulp.task('compilePO', function() {
  return gulp.src(paths.languages)
             .pipe(gettext())
             .pipe(gulp.dest(paths.destination + '/languages'))
             .pipe(gulpif(!config.production, server.stream()));
});


/**
 * Compress images into theme directory
 */
gulp.task('compileImages', function() {
  return gulp.src(paths.images)
             .pipe(plumber())
             .pipe(cache('images'))
             .pipe(imagemin())
             .pipe(gulp.dest(paths.destination + '/images'))
             .pipe(gulpif(!config.production, server.stream()));
});

/**
 * Add the text domain into the functions.php file and automatically reloads the page when the functions.php changes
 */
gulp.task('compileFunctions', function() {
  return gulp.src(paths.functions)
             .pipe(plumber())
             .pipe(replace('$text_domain', '"' + config.domain + '"'))
             .pipe(wrap('<?php global $text_domain; $text_domain = "' + config.domain + '"; $version = "' + Date.now() + '"; ?><%= contents %>'))
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
gulp.task('compile', gulp.series(
  'compileTemplates',
  'compileStylesheets',
  'compileJavascripts',
  'compileImages',
  'compileFunctions',
  'compilePOT',
  'compilePO',
  'compileMisc'
));

/**
 * Watch all the assets
 */
gulp.task('watchers', function() {
  if (!config.production) {
    gulp.watch([paths.stylesheets + '/**/*.styl', paths.config], gulp.series('compileStylesheets'));
    gulp.watch([paths.templates], gulp.series('compileTemplates', 'compilePOT'));
    gulp.watch([paths.javascripts], gulp.series('compileJavascripts'));
    gulp.watch([paths.images], gulp.series('compileImages'));
    gulp.watch([paths.root + '/functions/**/*.php'], gulp.series('compileFunctions'));
    gulp.watch([paths.functions], gulp.series('compilePOT'));
    gulp.watch([paths.languages], gulp.series('compilePO'));
  }
});

/**
 * Starts the live-reloaded web server
 */
gulp.task('live-reload', function(done) {
  if (!config.server && !_.isUndefined(config.server.proxy)) {
    server.init(config.server);
  }
  done();
});

/**
 * Cleans everything by deleting newly created folders
 */
gulp.task('hard-clean', function(callback) {
  del([
    __dirname + '/public',
    __dirname + '/wordpress',
    __dirname + '/tmp'
  ], callback);
});

/**
 * Compiles then watch assets if not in production
 */
gulp.task('launch', gulp.series(function loadTasks(done){
  if (!hasFile(__dirname + '/public') && !config.production) {
     gulp.series('download', 'unzip', 'rename', 'delete', 'compile', 'live-reload', 'watchers')();
  } else{
    gulp.series('compile', 'live-reload', 'watchers')();
  }
  done();
}));

gulp.task('default', gulp.series('launch'));

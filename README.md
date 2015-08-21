# Wordpress + Jade + Stylus
A sandbox for Wordpress theme development, using Jade + Stylus.

# Getting started
+ You need [NodeJS](https://nodejs.org/) to use this
+ Clone this repository by running `git clone https://github.com/bnetter/wordpress-gulp-jade-stylus.git wordpress-sandbox` (`wordpress-sandbox` is the folder name you're cloning to)
+ Move to the newly created directory and run `npm install`
+ Then run `gulp` once to download the latest Wordpress release
+ Copy `themes/default-skeleton` into `themes/your-theme`
+ Edit `themes/your-theme/config.json` file as you wish (view more on the [Wordpress Codex](https://codex.wordpress.org/File_Header))
+ Edit your theme name in the `config.json` root file
+ You're good to go ! Run `gulp` once again and go to `http://localhost:8080` to get started

# Options
You can edit the options by either editing the root `config.json` file or using the command line (for example: `gulp --production` would set `config.production` as `true`).

### `theme`
**Type**: `string`
**Description**: The Wordpress theme name you're working on. This should be identical to the theme directory name.

### `production`
**Type**: `boolean`
**Default**: `true`
**Description**: Whether you're compiling to production or development.

### `server`
**Type**: `boolean` or `object`
**Description**: By default, we use [Browser Sync](http://www.browsersync.io/) to inject file changes when working on a theme. You can set `server` as `false` if you don't want to use it.

### `server.proxy`
**Type**: `string`
**Default**: `local.wordpress.com`
**Description**: You need to have a running PHP server pointing to the `public` directory, and set `server.proxy` to the URL.

### `server.port`
**Type**: `number`
**Default**: `8080`
**Description**: The port used to live-reload. You can then access the live-reload server at `http://localhost:port`.

### `locals`
**Type**: `object`
**Description**: Variables we use in the template.

### `latestWordpressURL`
**Type**: `string`
**Default**: `https://wordpress.org/latest.zip`
**Description**: The URL we use to fetch the latest Wordpress release (ZIP).



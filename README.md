# Wordpress + Jade + Stylus
A sandbox for Wordpress theme development, using Jade + Stylus.

# Features
+ Javascript optimization
+ Image compression
+ i18n native support

# Getting started
+ You need [NodeJS](https://nodejs.org/) to use this
+ Clone this repository by running `git clone https://github.com/bnetter/wordpress-gulp-jade-stylus.git wordpress-sandbox` (`wordpress-sandbox` is the folder name you're cloning to)
+ Move to the newly created directory and run `npm install`
+ Then run `gulp` once to download the latest Wordpress release
+ Copy `themes/default-skeleton` into `themes/your-theme`
+ Edit `themes/your-theme/config.json` file as you wish (view more on the [Wordpress Codex](https://codex.wordpress.org/File_Header))
+ Edit your theme name in the `config.json` root file, here it would be `your-theme`
+ You need to have a PHP + MySQL server serving the files in the `public` folder. Mine would usually run on `http://local.wordpress.com`. Once you have that, you should edit `server.proxy` in your `config.json` file.
+ You're good to go ! Run `gulp` once again and go to `http://localhost:8080` to get started

# Options
You can edit the options by either editing the root `config.json` file or using the command line (for example: `gulp --production` would set `config.production` as `true`).

### `theme`
**Type**: `string`

**Description**: The Wordpress theme name you're working on. This should be identical to the theme directory name.

### `text-domain`
**Type**: `string`

**Description**: The text domain you will use for internationalization. We use `theme` as a default, and we put everywhere it's needed.

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

# About i18n
The Gulpfile automagically generates a POT file from your template files. It also puts the desired text domain everywhere it's needed.

To translate strings, just use the following example:

```jade
div= __('Is this translated?', $text_domain);
```

A POT file will be generated into the `languages` folder in the theme. Copy this, rename it as [the language you want to translate](http://www.w3.org/International/articles/language-tags/) (for example `fr_FR.po`). Then, the file will be compiled into a MO file and will automatically be used depending on your `WPLANG` attribute.

Read more about i18n on [the Wordpress Codex](https://developer.wordpress.org/themes/functionality/internationalization/).
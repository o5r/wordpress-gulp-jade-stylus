<?php
/**
 * i18n native support
 * Loading the 
 */

function load_i18n_files() {
  load_theme_textdomain($text_domain, get_template_directory() . '/languages/');
}

add_action('after_setup_theme', 'load_i18n_files');
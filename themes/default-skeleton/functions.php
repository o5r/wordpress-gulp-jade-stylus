<?php
/**
 * Loads `style.css` + `core.js`
 */

function enqueue_scripts() {
  wp_enqueue_style('main', get_stylesheet_uri()); // CSS stylesheet
  wp_enqueue_script('main', get_template_directory_uri() . '/core.js'); // CSS stylesheet
}

add_action('wp_enqueue_scripts', 'enqueue_scripts');
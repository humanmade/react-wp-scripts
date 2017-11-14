<?php
/**
 * Entrypoint for the theme.
 */

namespace ReactWPScripts;

/**
 * Is this a development environment?
 *
 * @return bool
 */
function is_development() {
	return apply_filters( 'reactwpscripts.is_development', WP_DEBUG );
}

/**
 * Get the port for React's development server.
 *
 * @return int|null Port number if available, otherwise null.
 */
function get_react_port() {
	if ( ! is_development() ) {
		return null;
	}

	$path = apply_filters( 'reactwpscripts.react_port_path', get_theme_file_path( 'react-port' ) );
	if ( ! file_exists( $path ) ) {
		return null;
	}

	$port = file_get_contents( $path );
	if ( empty( $port ) || ! is_numeric( $port ) ) {
		return null;
	}

	return (int) trim( $port );
}

/**
 * @param string $directory Root directory containing `src` and `build` directory.
 * @param array $opts {
 *     @type string $base_url Root URL containing `src` and `build` directory. Only needed for production.
 *     @type string $handle  Style/script handle. (Default is last part of directory name.)
 *     @type array  $scripts Script dependencies.
 *     @type array  $styles  Style dependencies.
 * }
 */
function enqueue_assets( $directory, $opts = [] ) {
	$handle = basename( $directory );
	$defaults = [
		'base_url' => '',
		'handle' => $handle,
		'scripts' => [],
		'styles' => []
	];
	$opts = wp_parse_args( $opts, $defaults );

	$port = get_react_port();
	if ( $port ) {
		wp_enqueue_script(
			$opts['handle'],
			sprintf( 'http://localhost:%d/static/js/bundle.js', $port ),
			$opts['scripts'],
			null,
			true
		);
	} else {
		$path     = trailingslashit( $directory ) . 'build/asset-manifest.json';
		$manifest = [];
		if ( file_exists( $path ) ) {
			$data = file_get_contents( $path );
			$manifest = (array) json_decode( $data );
		}

		$base_url = trailingslashit( $opts['base_url'] );

		wp_enqueue_script(
			$opts['handle'],
			$base_url . 'build/' . $manifest['main.js'],
			$opts['scripts'],
			null,
			true
		);

		wp_enqueue_style(
			$opts['handle'],
			$base_url . 'build/' . $manifest['main.css'],
			$opts['styles'],
			null
		);
	}
}

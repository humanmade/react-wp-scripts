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
 * Attempt to load a file at the specified path and parse its contents as JSON.
 *
 * @param string $path The path to the JSON file to load.
 * @return array|null;
 */
function load_asset_file( $path ) {
	if ( ! file_exists( $path ) ) {
		return null;
	}
	$contents = file_get_contents( $path );
	if ( empty( $path ) ) {
		return null;
	}
	return json_decode( $contents, true );
}

/**
 * Check a directory for a root or build asset manifest file, and attempt to
 * decode and return the asset list JSON if found.
 *
 * @param string $directory Root directory containing `src` and `build` directory.
 * @return array|null;
 */
function get_assets_list( string $directory ) {
	$directory = trailingslashit( $directory );
	if ( is_development() ) {
		$dev_assets = load_asset_file( $directory . 'asset-manifest.json' );
		// Fall back to build directory if there is any error loading the development manifest.
		if ( ! empty( $dev_assets ) ) {
			return array_values( $dev_assets );
		}
	}

	$production_assets = load_asset_file( $directory . 'build/asset-manifest.json' );

	if ( ! empty( $production_assets ) ) {
		// Prepend "build/" to all build-directory array paths.
		return array_map(
			function( $asset_path ) { return 'build/' . $asset_path; },
			array_values( $production_assets )
		);
	}

	return null;
}

/**
 * Infer a base web URL for a file system path.
 *
 * @param string $path Filesystem path for which to return a URL.
 * @return string|null
 */
function infer_base_url( string $path ) {
	if ( strpos( $path, get_stylesheet_directory() ) === 0 ) {
		return get_theme_file_uri( substr( $path, strlen( get_stylesheet_directory() ) ) );
	}

	if ( strpos( $path, get_template_directory() ) === 0 ) {
		return get_theme_file_uri( substr( $path, strlen( get_template_directory() ) ) );
	}

	// Any path not known to exist within a theme is treated as a plugin path.
	$plugin_path = plugin_dir_path( __FILE__ );
	if ( strpos( $path, $plugin_path ) === 0 ) {
		return plugin_dir_url( __FILE__ ) . substr( $path, strlen( $plugin_path ) );
	}

	return '';
}

/**
 * Return web URIs or convert relative filesystem paths to absolute paths.
 *
 * @param string $asset_path A relative filesystem path or full resource URI.
 * @param string $base_url   A base URL to prepend to relative bundle URIs.
 * @return string
 */
function get_asset_uri( string $asset_path, string $base_url ) {
	if ( strpos( $asset_path, '://' ) !== false ) {
		return $asset_path;
	}

	return trailingslashit( $base_url ) . $asset_path;
}

/**
 * @param string $directory Root directory containing `src` and `build` directory.
 * @param array $opts {
 *     @type string $base_url Root URL containing `src` and `build` directory. Only needed for production.
 *     @type string $handle   Style/script handle. (Default is last part of directory name.)
 *     @type array  $scripts  Script dependencies.
 *     @type array  $styles   Style dependencies.
 * }
 */
function enqueue_assets( $directory, $opts = [] ) {
	$defaults = [
		'base_url' => '',
		'handle'   => basename( $directory ),
		'scripts'  => [],
		'styles'   => [],
	];

	$opts = wp_parse_args( $opts, $defaults );

	$assets = get_assets_list( $directory );

	$base_url = $opts['base_url'];
	if ( empty( $base_url ) ) {
		$base_url = infer_base_url( $directory );
	}

	if ( empty( $assets ) ) {
		// TODO: This should be an error condition.
		return;
	}

	// There will be at most one JS and one CSS file in vanilla Create React App manifests.
	foreach ( $assets as $asset_path ) {
		$is_js = preg_match( '/\.js$/', $asset_path );
		$is_css = preg_match( '/\.css$/', $asset_path );

		if ( ! $is_js && ! $is_css ) {
			// Assets such as source maps and images are also listed; ignore these.
			continue;
		}

		if ( $is_js ) {
			wp_enqueue_script(
				$opts['handle'],
				get_asset_uri( $asset_path, $base_url ),
				[],
				null,
				true
			);
		} else if ( $is_css ) {
			wp_enqueue_style(
				$opts['handle'],
				get_asset_uri( $asset_path, $base_url )
			);
		}
	}
}

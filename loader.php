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
 * Create a probably-unique key for a given script bundle.
 *
 * @param string $path A relative filesystem path or resource URI.
 * @return string
 */
function get_asset_key( string $path ) {
	$path_parts = explode( '/', $path );
	return 'react_wp_script_' . end( $path_parts );
}

/**
 * Convert a relative path within a theme or plugin to an absolute filesystem path.
 *
 * @param string $path     A relative file system path.
 * @param bool   $is_theme Whether to treat the $path as a theme file.
 * @return string;
 */
function get_file_path( string $path, bool $is_theme ) {
	return $is_theme
		? get_theme_file_path( $path )
		: plugin_dir_path( __file__ ) . $path;
}

/**
 * Check the filesystem for asset manifests for a theme or plugin and attempt to
 * decode and return the asset list JSON if found.
 *
 * @param bool $is_theme Whether to look for the manifest in a theme or plugin context.
 * @return array|null;
 */
function get_assets_list( string $is_theme ) {
	if ( is_development() ) {
		// Fall back to build directory if there is any error loading the development manifest.
		$dev_assets_path = get_file_path( 'asset-manifest.json', $is_theme );
		if ( file_exists( $dev_assets_path ) ) {
			$dev_assets_contents = file_get_contents( $dev_assets_path );
			if ( ! empty( $dev_assets_contents ) ) {
				return array_values( json_decode( $dev_assets_contents, true ) );
			}
		}
	}
	$build_assets_path = get_file_path( 'build/asset-manifest.json', $is_theme );
	if ( file_exists( $build_assets_path ) ) {
		$build_assets_contents = file_get_contents( $build_assets_path );
		if ( ! empty( $build_assets_contents ) ) {
			// Prepend "build/" to all build-directory array paths.
			return array_map(
				function( $asset_path ) { return 'build/' . $asset_path; },
				array_values( json_decode( $build_assets_contents, true ) )
			);
		}
	}
	return null;
}


/**
 * Return web URIs or convert relative filesystem paths to absolute paths.
 *
 * @param string $asset_path  A relative filesystem path or resource URI.
 * @param bool   $is_theme    Whether to treat the $path as a theme file.
 * @return string
 */
function get_asset_uri( string $asset_path, bool $is_theme ) {
	if ( strpos( $asset_path, '://' ) !== false ) {
		return $asset_path;
	}
	if ( ! is_development() ) {
		$asset_path = 'build/' . $asset_path;
	}
	return $is_theme
		? get_theme_file_uri( $asset_path )
		: plugin_dir_url( __file__ ) . $asset_path;
}

/**
 * Search for webpack-manifest-plugin output, attempt to load it, and enqueue
 * any scripts or styles contained within.
 *
 * @param bool $is_theme Whether to look for files in a theme or plugin context.
 */
function autoenqueue_assets( bool $is_theme ) {
	// Attempt to load
	$assets = get_assets_list( $is_theme );
	if ( empty( $assets ) ) {
		// TODO: This should be an error condition.
		return;
	}

	foreach ( $assets as $asset_path ) {
		$is_js = preg_match( '/\.js$/', $asset_path );
		$is_css = preg_match( '/\.css$/', $asset_path );
		if ( ! $is_js && ! $is_css ) {
			continue;
		}
		// Asset file contains URIs, enqueue them directly.
		if ( $is_js ) {
			wp_enqueue_script(
				get_asset_key( $asset_path ),
				get_asset_uri( $asset_path, $is_theme ),
				[],
				null,
				true
			);
		} else if ( $is_css ) {
			wp_enqueue_style(
				get_asset_key( $asset_path ),
				get_asset_uri( $asset_path, $is_theme )
			);
		}
	}
}

/**
 * Wrapper function to auto-enqueue all built assets for a theme.
 */
function autoenqueue_theme_assets() {
	autoenqueue_assets( true );
}

/**
 * Wrapper function to auto-enqueue all built assets for a plugin.
 */
function autoenqueue_plugin_assets() {
	autoenqueue_assets( false );
}

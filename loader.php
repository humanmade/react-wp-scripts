<?php
/**
 * Entrypoint for the theme.
 */

namespace %%NAMESPACE%%;

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
	if ( empty( $contents ) ) {
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
	$path = wp_normalize_path( $path );

	$stylesheet_directory = wp_normalize_path( get_stylesheet_directory() );
	if ( strpos( $path, $stylesheet_directory ) === 0 ) {
		return get_theme_file_uri( substr( $path, strlen( $stylesheet_directory ) ) );
	}

	$template_directory = wp_normalize_path( get_template_directory() );
	if ( strpos( $path, $template_directory ) === 0 ) {
		return get_theme_file_uri( substr( $path, strlen( $template_directory ) ) );
	}

	// Any path not known to exist within a theme is treated as a plugin path.
	$plugin_path = get_plugin_basedir_path();
	if ( strpos( $path, $plugin_path ) === 0 ) {
		return plugin_dir_url( __FILE__ ) . substr( $path, strlen( $plugin_path ) + 1 );
	}

	return '';
}

/**
 * Return the path of the plugin basedir.
 *
 * @return string
 */
function get_plugin_basedir_path() {
	$plugin_dir_path = wp_normalize_path( plugin_dir_path( __FILE__ ) );

	$plugins_dir_path = wp_normalize_path( trailingslashit( WP_PLUGIN_DIR ) );

	return substr( $plugin_dir_path, 0, strpos( $plugin_dir_path, '/', strlen( $plugins_dir_path ) + 1 ) );
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
	];

	$opts = wp_parse_args( $opts, $defaults );

	$assets = get_assets_list( $directory );

	$base_url = $opts['base_url'];
	if ( empty( $base_url ) ) {
		$base_url = infer_base_url( $directory );
	}

	if ( empty( $assets ) ) {
		if ( WP_DEBUG ) {
			handle_assets_error();
		}
		else {
			// Trigger a warning, but otherwise do nothing.
			trigger_error( 'React WP Scripts Error: Unable to find React asset manifest', E_USER_WARNING );
		}
	}

	// There will be at most one JS and one CSS file in vanilla Create React App manifests.
	$has_css = false;
	foreach ( $assets as $asset_path ) {
		$is_js    = preg_match( '/\.js$/', $asset_path );
		$is_css   = preg_match( '/\.css$/', $asset_path );
		$is_chunk = preg_match( '/\.chunk\./', $asset_path );

		if ( ( ! $is_js && ! $is_css ) || $is_chunk ) {
			// Assets such as source maps and images are also listed; ignore these.
			continue;
		}

		if ( $is_js ) {
			wp_enqueue_script(
				$opts['handle'],
				get_asset_uri( $asset_path, $base_url ),
				$opts['scripts'],
				null,
				true
			);
		} else if ( $is_css ) {
			$has_css = true;
			wp_enqueue_style(
				$opts['handle'],
				get_asset_uri( $asset_path, $base_url ),
				$opts['styles']
			);
		}
	}

	// Ensure CSS dependencies are always loaded, even when using CSS-in-JS in
	// development.
	if ( ! $has_css ) {
		wp_register_style(
			$opts['handle'],
			null,
			$opts['styles']
		);
		wp_enqueue_style( $opts['handle'] );
	}
}

/**
 * Display an overlay error when the React bundle cannot be loaded. It also stops the execution.
 *
 * @param array $details
 */
function handle_assets_error( $details = [] ) {
	?>
	<style>
		/**
		 * Copyright (c) 2015-present, Facebook, Inc.
		 *
		 * This source code is licensed under the MIT license found in the
		 * LICENSE file in the root directory of this source tree.
		 */

		/* @flow */

		html, body {
			overflow: hidden;
		}

		.error-overlay {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			border: none;
			z-index: 1000;

			--black: #293238;
			--dark-gray: #878e91;
			--red: #ce1126;
			--red-transparent: rgba(206, 17, 38, 0.05);
			--light-red: #fccfcf;
			--yellow: #fbf5b4;
			--yellow-transparent: rgba(251, 245, 180, 0.3);
			--white: #ffffff;
		}

		.error-overlay .wrapper {
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			text-align: center;
			background-color: var( --white );
		}

		.primaryErrorStyle {
			background-color: var( --red-transparent );
		}

		.error-overlay .overlay {
			position: relative;
			display: inline-flex;
			flex-direction: column;
			height: 100%;
			width: 1024px;
			max-width: 100%;
			overflow-x: hidden;
			overflow-y: auto;
			padding: 0.5rem;
			box-sizing: border-box;
			text-align: left;
			font-family: Consolas, Menlo, monospace;
			font-size: 13px;
			line-height: 2;
			color: var( --black );
		}

		.header {
			font-size: 2em;
			font-family: sans-serif;
			color: var( --red );
			white-space: pre-wrap;
			margin: 0 2rem 0.75rem 0;
			flex: 0 0 auto;
			max-height: 50%;
			overflow: auto;
		}

		.error-content {
			padding:1rem;
		}

		code {
			background-color: rgba(27,31,35,.05);
			margin: 0;
			padding: .2em .4em;
		}
	</style>
	<div class="error-overlay">
		<div class="wrapper primaryErrorStyle">
			<div class="overlay">
				<div class="header">Failed to render</div>
				<div class="error-content primaryErrorStyle">
					Unable to find React asset manifest.
					<code>react-wp-scripts</code> was unable to find either a development or production asset manifest.
					Run <code>npm start</code> to start the development server or <code>npm run build</code> to build a production bundle.
				</div>
			</div>
		</div>
	</div>
	<?php
	die();
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const ManifestPlugin = require( 'webpack-manifest-plugin' );

// Load in the default configuration. This primes the require cache we will override below.
const devConfig = require.resolve( 'react-scripts/config/webpack.config.js' );
const configFactory = require( devConfig );
const config = configFactory('development');
const devServerConfig = require.resolve( 'react-scripts/config/webpackDevServer.config.js' );
const createServerConfig = require( devServerConfig );

// Load in common defaults for WP.
const applyWpConfig = require( '../overrides/applyWpConfig' );

// Override paths on require to shortcircuit index.html requirement.
const requireMiddleware = require('require-middleware');
requireMiddleware.use( (req, next) => {
    if ( req.request.indexOf('../config/') === 0 && req.path.indexOf('react-scripts/config') >= 0 ) {
        return require( req.request );
    }
    next();
} );

/**
 * Method to apply overrides to webpack dev config object.
 *
 * @param {object} config    The webpack dev configuration object.
 * @param {string} devServer The protocol, host & port of the running dev server.
 */
const overrideWebpackConfig = ( config, devServer ) => {

	// Force the publicPath to point at the running dev server's address. This
	// ensures that references to files emitted by the build will be relative
	// to the running development server. This path requires a trailing slash.
	config.output.publicPath = `${ devServer }/`;

	// Replace the react-dev-utils webpackHotDevClient with a version patched to
	// correctly detect the dev server host & port for socket requests.
	const hotClient = require.resolve( 'react-dev-utils/webpackHotDevClient' );

	if ( Array.isArray( config.entry ) ) {
		const hotClientIndex = config.entry.indexOf( hotClient );
		if ( hotClientIndex >= 0 ) {
			config.entry.splice( hotClientIndex, 1, require.resolve( '../overrides/webpackHotDevClient' ) );
		}
	} else if ( config.entry instanceof Object ) {
		Object.entries( config.entry ).forEach( ( [ key, entry ] ) => {
			if ( entry === hotClient ) {
				config.entry[key] = require.resolve( '../overrides/webpackHotDevClient' );
			} else if ( Array.isArray( entry ) ) {
				const hotClientIndex = entry.indexOf( hotClient );
				if ( hotClientIndex >= 0 ) {
					config.entry[key].splice( hotClientIndex, 1, require.resolve( '../overrides/webpackHotDevClient' ) );
				}
			}
		} );
	}

	// Remove built-in manifest plugin.
	config.plugins = config.plugins.filter( plugin => ! ( plugin instanceof ManifestPlugin ) );

	// Patch in a ManifestPlugin instance configured to emit from within
	// webpack-dev-server. This file contains a mapping of all asset filenames
	// to their corresponding output URI so that WordPress can load relevant
	// files from the dev server.
	config.plugins.push( new ManifestPlugin( {
		basePath: config.output.publicPath,
		fileName: '../asset-manifest.json',
		writeToFileEmit: true,
	} ) );

	// Apply default config settings for WordPress.
	return () => applyWpConfig( config );
};

/**
 * Apply overrides to the webpack-dev-server's configuration object.
 *
 * @param {object} serverConfig The development server configuration object.
 */
const overrideServerConfig = serverConfig => {
	// Permit dev server access from our WordPress host.
	serverConfig.headers = Object.assign({}, serverConfig.headers, {
		'Access-Control-Allow-Origin': '*',
	});
	return serverConfig;
}

/**
 * Override the require cache's copies of the webpack and dev server config.
 *
 * @param {string} devServer The protocol, host & port of the running dev server.
 */
module.exports = devServer => {
	// Replace config modules in require cache with overridden versions.
	require.cache[ devConfig ].exports = overrideWebpackConfig( config, devServer );
	require.cache[ devServerConfig ].exports = ( ...args ) => {
		const serverConfig = createServerConfig( ...args );
		return overrideServerConfig( serverConfig );
	};
};

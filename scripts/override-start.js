process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const ManifestPlugin = require( 'webpack-manifest-plugin' );

// Load in the default configuration. This primes the require cache we will override below.
const devConfig = require.resolve( 'react-scripts/config/webpack.config.dev.js' );
const config = require( devConfig );
const devServerConfig = require.resolve( 'react-scripts/config/webpackDevServer.config.js' );
const createServerConfig = require( devServerConfig );

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
	const hotClientIndex = config.entry.indexOf( hotClient );
	config.entry.splice(hotClientIndex, 1, require.resolve( '../overrides/webpackHotDevClient' ) );

	// Also patch in a ManifestPlugin instance configured to emit from within
	// webpack-dev-server. This file contains a mapping of all asset filenames
	// to their corresponding output URI so that WordPress can load relevant
	// files from the dev server.
	config.plugins.push(new ManifestPlugin({
		basePath: config.output.publicPath,
		fileName: 'asset-manifest.json',
		writeToFileEmit: true,
	}));

	return config;
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

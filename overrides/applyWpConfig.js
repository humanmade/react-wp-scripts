const paths = require( 'react-wp-scripts/config/paths' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const InterpolateHtmlPlugin = require( 'react-dev-utils/InterpolateHtmlPlugin' );

module.exports = config => {
	const appNameVar = require(paths.appPackageJson).name.replace( /[\W]+/g, '' );

	// Remove HTML file output plugins.
	config.plugins = config.plugins.filter( plugin => ! ( plugin instanceof HtmlWebpackPlugin ) );
	config.plugins = config.plugins.filter( plugin => ! ( plugin instanceof InterpolateHtmlPlugin ) );

	// Change the optimization settings to only output async chunks. This means
	// only the runtime and main bundle file need to be enqueued and helps us
	// avoid the possiblity of enqueuing the wrong initial chunk file.
	config.optimization.splitChunks.chunks = 'async';

	// Set a default JSONP function name to avoid conflicts with other instances
	// of react-wp-scripts using code splitting.
	config.output.jsonpFunction = `${appNameVar}JSONP`;

	// Set some useful externals based on what WP provides in v5.x.
	config.externals = Object.assign( config.externals || {}, {
		wp: 'wp',
		react: 'React',
		'react-dom': 'ReactDOM',
		moment: 'moment',
		lodash: 'lodash',
	} );

	return config;
};

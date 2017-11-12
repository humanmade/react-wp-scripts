process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const paths = require( 'react-scripts/config/paths');

// Inject our overrides!

// Load in the current configuration.
const devConfig = require.resolve( 'react-scripts/config/webpack.config.dev.js' );
const config = require( devConfig );

// Apply overrides to config.
const override = config => {
	// Force-set the public URL.
	config.output.publicPath = `http://localhost:${ process.env.PORT }/`;

	// Override the hot client.
	const hotClient = require.resolve( 'react-dev-utils/webpackHotDevClient' );
	const hotClientIndex = config.entry.indexOf( hotClient );
	config.entry[ hotClientIndex ] = require.resolve( '../overrides/webpackHotDevClient' );

	const ExtractTextPlugin = require('extract-text-webpack-plugin');

	// Add SCSS.
	/*const extractSass = new ExtractTextPlugin({
		filename: "[name].[contenthash].css",
		disable: process.env.NODE_ENV === "development"
	});
	function rewireSass(config, env) {
		config.module.rules.find( rule => rule.hasOwnProperty( 'oneOf' ) ).oneOf.unshift( {
			test: /\.scss$/,
			use: (env === 'development') ?
				[
					{
						loader: "style-loader",
					},
					{
						loader: "css-loader",
					},
					{
						loader: "sass-loader",
					}
				]
			: extractSass.extract( {
				use: [
					{
						loader: "css-loader"
					},
					{
						loader: "sass-loader"
					}
				],
				// use style-loader in development
				fallback: "style-loader"
			} ),
		} );

		return config;
	}

	config = rewireSass( config, process.env.NODE_ENV );
	*/

	return config;
};

// Replace config in require cache with overridden.
require.cache[ devConfig ].exports = override( config );

// Load the starter.
require( 'react-scripts/scripts/start' );

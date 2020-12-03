const paths = require('react-scripts/config/paths.js');

module.exports = Object.assign( paths, {
	// We point this to the template file in react-scripts to bypass the
	// start and build script checks for the existence of this file. The
	// index.html & public folder are of no use in a WP context.
	appHtml: require.resolve('react-scripts/template/public/index.html'),
	// Force the served path to a relative URL to generate the correct
	// service worker precache manifest and also correct paths in the
	// asset-manifest.json file.
	servedPath: './',
} );

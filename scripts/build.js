const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const rimraf = require('rimraf');
const paths = require('../config/paths');

// Override paths on require to shortcircuit index.html requirement.
const requireMiddleware = require('require-middleware');
requireMiddleware.use((req, next) => {
    if (req.request === '../config/paths' && req.path.indexOf('react-scripts/config/paths') >= 0) {
        return require('react-wp-scripts/config/paths');
    }
    next();
});

const tmpPath = path.join( process.cwd(), 'public' );

// Create a public directory to copy from during build step so that
// mini-css-extract doesn't fall over.
fs.mkdir( tmpPath, (err) => {
	if ( err && err.code !== 'EEXIST' ) {
		console.log( chalk.green( `Could not create temp public directory for build at ${ tmpPath }.` ) );
		return;
	}

	// Shim the index.html file before running the standard build script.
	fs.writeFile( `${tmpPath}/index.html`, '', () => {
		require('react-scripts/scripts/build');
	} );
} );

// Clean up on aisle 3.
process.on( 'beforeExit', () => {
	fs.unlinkSync( `${paths.appBuild}/index.html`, () => {} );
	rimraf( tmpPath, () => {
		process.exit();
	} );
} );

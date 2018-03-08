/**
 * Sets the start script for react-wp-scripts and moves
 * loader.php to the project root folder.
 */
'use strict';

process.on( 'unhandledRejection', err => {
	throw err;
} );

const fs = require( 'fs-extra' );
const path = require( 'path' );
const chalk = require( 'chalk' );

const argv = require( 'minimist' )( process.argv.slice( 2 ) );

module.exports = function(
	appPath,
	appName,
	verbose,
	originalDirectory,
	template
) {

	// Parse a namespace based on the name of the package
	let namespace = argv['php-namespace'] || 'ReactWPScripts';

	const pkgName = require( path.join( __dirname, '..', 'package.json' ) ).name;
	const reactWPScriptsPath = path.join( appPath, 'node_modules', pkgName );
	const appPackage = require( path.join( appPath, 'package.json' ) );

	const scriptsPath = path.resolve(
		process.cwd(),
		'node_modules',
		'react-scripts',
		'scripts',
		'init.js'
	);
	const reactScriptsInit = require(scriptsPath);
	reactScriptsInit( appPath, appName, verbose, originalDirectory, template );

	// Setup the custom start script
	appPackage.scripts.start = 'react-wp-scripts start';

	fs.writeFileSync(
		path.join( appPath, 'package.json' ),
		JSON.stringify( appPackage, null, 2 )
	);

	// Copy the loader.php
	const loaderPath = path.join( reactWPScriptsPath, 'loader.php' );

	const destinationFile = path.join( appPath, 'react-wp-scripts.php' );
	fs.copy( loaderPath, destinationFile )
		.then( () => new Promise( ( resolve, reject ) => {
			// Replace %%NAMESPACE%% for the specified namespace
			fs.readFile( destinationFile, 'utf8', function( err, data ) {
				if ( err ) {
					return reject( err );
				}

				var result = data.replace( '%%NAMESPACE%%', namespace );
				fs.writeFile( destinationFile, result, 'utf8', function( err ) {
					if ( err ) {
						return reject( err );
					}
					resolve();
				} );
			} );
		} ) )
		.then( () => {
			console.log( chalk.green( 'React WP Scripts Loader copied to your project root folder.' ) );
			console.log( chalk.green( 'Please follow these instructions to enqueue your assets in PHP:' ) );
			console.log( chalk.blue( 'https://github.com/humanmade/react-wp-scripts#react-wp-scripts' ) );
		} )
		.catch( err => {
			console.log( chalk.bgRed( 'React WP Scripts loader could not be copied to your root folder. Error details:' ) );
			console.log( chalk.red( err ) );
		} );
};

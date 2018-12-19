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
const os = require('os');
const rimraf = require('rimraf');

const argv = require( 'minimist' )( process.argv.slice( 2 ) );

module.exports = function(
	appPath,
	appName,
	verbose,
	originalDirectory,
	template
) {

	// Parse a namespace based on the name of the package
	const namespace = argv['php-namespace'] || 'ReactWPScripts';

	const pkgName = require( path.join( __dirname, '..', 'package.json' ) ).name;
	const reactWPScriptsPath = path.join( appPath, 'node_modules', pkgName );
	const appPackage = require( path.join( appPath, 'package.json' ) );

	const useTypeScript = appPackage.dependencies['typescript'] != null;

	const scriptsPath = path.resolve(
		process.cwd(),
		'node_modules',
		'react-scripts',
		'scripts',
		'init.js'
	);
	const reactScriptsInit = require(scriptsPath);
	reactScriptsInit( appPath, appName, verbose, originalDirectory, template );

	// Setup the custom scripts
	appPackage.scripts.start = 'react-wp-scripts start';
	appPackage.scripts.build = 'react-wp-scripts build';

	// Set relative homepage
	appPackage.homepage = '.';

	fs.writeFileSync(
		path.join( appPath, 'package.json' ),
		JSON.stringify( appPackage, null, 2 )
	);

	// Remove public folder
	rimraf( path.join( appPath, 'public' ), () => {} );

	// Derive a var name we can use for a dynamic public path
	const publicPathVar = `${ appName.replace( /[\W]+/g, '' ) }BuildURL`;

	// Get relevant file paths
	const publicPathPath = path.join( reactWPScriptsPath, 'template/src/publicPath.js' );
	const publicPathDest = path.join( appPath, 'src/publicPath.js' );
	const srcIndexPath = path.join( appPath, 'src', useTypeScript ? 'index.tsx' : 'index.js' );
	const loaderPath = path.join( reactWPScriptsPath, 'loader.php' );
	const loaderDest = path.join( appPath, 'react-wp-scripts.php' );

	// Replace %%PUBLIC_PATH_VAR%% and process.env.PUBLIC_URL in these files
	const publicPathFiles = [
		path.join( appPath, 'src', 'serviceWorker.js' ),
		publicPathDest,
		loaderDest,
	];

	fs.copy( publicPathPath, publicPathDest )
		// Insert import for public path file.
		.then( () => new Promise( ( resolve, reject ) => {
			fs.readFile( srcIndexPath, 'utf8', function( err, data ) {
				if ( err ) {
					return reject( err );
				}

				var result = `import './publicPath';${os.EOL}${data}`;
				fs.writeFile( srcIndexPath, result, 'utf8', function( err ) {
					if ( err ) {
						return reject( err );
					}
					resolve();
				} );
			} );
		} ) )
		// Copy the loader.php
		.then( () => fs.copy( loaderPath, loaderDest ) )
		.then( () => new Promise( ( resolve, reject ) => {
			// Replace %%NAMESPACE%% for the specified namespace
			fs.readFile( loaderDest, 'utf8', function( err, data ) {
				if ( err ) {
					return reject( err );
				}

				var result = data.replace( '%%NAMESPACE%%', namespace );
				fs.writeFile( loaderDest, result, 'utf8', function( err ) {
					if ( err ) {
						return reject( err );
					}
					resolve();
				} );
			} );
		} ) )
		.then( () => new Promise( ( resolve, reject ) => {
			publicPathFiles.forEach( ( filePath, i ) => {
				fs.readFile( filePath, 'utf8', function( err, data ) {
					if ( err ) {
						return reject( err );
					}

					var result = data
						.replace( '%%PUBLIC_PATH_VAR%%', publicPathVar )
						.replace( 'process.env.PUBLIC_URL', publicPathVar );
					fs.writeFile( filePath, result, 'utf8', function( err ) {
						if ( err ) {
							return reject( err );
						}
						if ( i + 1 === publicPathFiles.length  ) {
							return resolve();
						}
					} );
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

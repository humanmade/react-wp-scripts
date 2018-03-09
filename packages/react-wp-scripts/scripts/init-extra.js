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

module.exports = function (
	type,
	appPath,
	appName,
	namespace
) {
	const reactWPScriptsPath = path.join( appPath, 'node_modules', 'react-wp-scripts' );
	const appPackage = require( path.join( appPath, 'package.json' ) );

	// Copy the template files.
	const templateDir = path.join( reactWPScriptsPath, 'template', type );
	const replacements = {
		'%%NAMESPACE%%': namespace,
		'%%APP_NAME%%': appName,
	};

	fs.readdir( templateDir, ( err, files ) => {
		const copied = files.map( file => {
			const sourceFile = path.join( templateDir, file );
			const destinationFile = path.join( appPath, file );

			return fs.copy( sourceFile, destinationFile )
				.then( () => new Promise( ( resolve, reject ) => {
					// Replace %%NAMESPACE%% for the specified namespace
					fs.readFile( destinationFile, 'utf8', function( err, data ) {
						if ( err ) {
							return reject( err );
						}

						let result = data;
						Object.keys( replacements ).forEach( key => {
							result = result.replace( key, replacements[ key ] );
						} );

						if ( result === data ) {
							return resolve();
						}

						fs.writeFile( destinationFile, result, 'utf8', function( err ) {
							if ( err ) {
								return reject( err );
							}
							resolve();
						} );
					} );
				} ) );
		} );

		Promise.all( copied ).then( () => {
			if ( type === 'plugin' ) {
				console.log( "Don't forget to activate your plugin " + chalk.green( appName ) + ' in the WordPress admin.' );
			} else {
				console.log( "Don't forget to activate your theme " + chalk.green( appName ) + ' in the WordPress admin.' );
			}
		} );
	} );
};

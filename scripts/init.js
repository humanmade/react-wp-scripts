'use strict';

// Sets the start script for react-wp-scripts
// And move the loader.php to the project root folder
process.on( 'unhandledRejection', err => {
	throw err;
} );

const fs = require( 'fs-extra' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const spawn = require( 'react-dev-utils/crossSpawn' );

module.exports = function(
	appPath,
	appName,
	verbose,
	originalDirectory,
	template
) {
	const pkgName = require( path.join( __dirname, '..', 'package.json' ) ).name;
	const reactWPScriptsPath = path.join( appPath, 'node_modules', pkgName );
	const appPackage = require( path.join( appPath, 'package.json' ) );
	const useYarn = fs.existsSync( path.join( appPath, 'yarn.lock' ) );

	// Copy over some of the devDependencies
	appPackage.dependencies = appPackage.dependencies || {};

	// Setup the script rules
	appPackage.scripts = {
		start: 'react-wp-scripts start',
	};

	fs.writeFileSync(
		path.join( appPath, 'package.json' ),
		JSON.stringify( appPackage, null, 2 )
	);

	// Copy the loader.php
	const loaderPath = path.join( reactWPScriptsPath, 'loader.php' );

	function successMessage() {
		console.log( chalk.green( 'React WP Scripts Loader copied to your project root folder.' ) );
		console.log( chalk.green( 'Please, follow instructions to add PHP to enqueue your assets:' ) );
		console.log( chalk.blue( 'https://github.com/humanmade/react-wp-scripts#react-wp-scripts' ) );
	}

	fs.copy( loaderPath, path.join( appPath, 'loader-react-scripts.php' ) )
		.then( () => successMessage() )
		.catch( err => {
			console.log( chalk.bgRed( 'React WP Scripts loader could not be copied to your root folder. Error details:' ) );
			console.log( chalk.red( err ) );
		} );
};

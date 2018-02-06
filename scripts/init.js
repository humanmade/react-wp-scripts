'use strict';

// Sets the start script for react-wp-scripts
// And move the loader.php to the project root folder
process.on( 'unhandledRejection', err => {
	throw err;
} );

const fs = require( 'fs-extra' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const commander = require('commander');
const packageJson = require('../package.json');

const program = new commander.Command( packageJson.name )
	.version( packageJson.version )
	.option( '--php-namespace [namespace]', 'Specify a namespace. Default: ReactWPScripts' )
	.parse( process.argv );


module.exports = function(
	appPath,
	appName,
	verbose,
	originalDirectory,
	template
) {
	const namespace = program.phpNamespace ? program.phpNamespace : 'ReactWPScripts';
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

	function successMessage() {
		console.log( chalk.green( 'React WP Scripts Loader copied to your project root folder.' ) );
		console.log( chalk.green( 'Please, follow instructions to add PHP to enqueue your assets:' ) );
		console.log( chalk.blue( 'https://github.com/humanmade/react-wp-scripts#react-wp-scripts' ) );
	}

	const destinationFile = path.join( appPath, 'react-wp-scripts.php' );
	fs.copy( loaderPath, destinationFile )
		.then( () => {
		// Replace %%NAMESPACE%% for the specified namespace
		fs.readFile(destinationFile, 'utf8', function(err, data) {
		if (err) {
			console.log(err);
		}

		var result = data.replace('%%NAMESPACE%%',namespace);
		fs.writeFile(destinationFile, result, 'utf8', function(err) {
			if (err) {
				return console.log(err);
			};
		});
	});
})
.then( () => successMessage() )
.catch( err => {
		console.log( chalk.bgRed( 'React WP Scripts loader could not be copied to your root folder. Error details:' ) );
	console.log( chalk.red( err ) );
} );
};

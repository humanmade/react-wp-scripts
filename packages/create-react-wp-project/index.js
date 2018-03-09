#!/usr/bin/env node

const chalk = require( 'chalk' );
const commander = require( 'commander' );
const child_process = require( 'child_process' );
const envinfo = require( 'envinfo' );
const fs = require( 'fs-extra' );
const path = require( 'path' );
const upperCamelCase = require( 'uppercamelcase' );

const craPath = require.resolve( 'create-react-app' );

function runCRA( args, namespace ) {
	// Run, with our default flags.
	const opts = {
		stdio: 'inherit',
	};
	args.unshift(
		'--using-crwp',
		'--scripts-version',
		'file:' + __dirname + '/../react-wp-scripts',
		'--php-namespace',
		namespace,
	);

	return new Promise( resolve => {
		const proc = child_process.spawn( craPath, args, opts );
		proc.on( 'close', code => {
			if ( code !== 0 ) {
				process.exit( code );
			}

			resolve();
		} );
	} );
}

function runAdditionalScripts( type, name, autoNamespace ) {
	const rootDir = path.resolve( name );
	const appName = path.basename( rootDir );

	const originalDirectory = process.cwd();
	process.chdir( rootDir );

	// Run our follow-up.
	const scriptsPath = path.resolve(
		process.cwd(),
		'node_modules',
		'react-wp-scripts',
		'scripts',
		'init-extra.js'
	);
	const initExtra = require( scriptsPath );
	initExtra( type, rootDir, appName, autoNamespace );
}

module.exports = function ( projectType, packageJson ) {
	const args = process.argv;

	let projectName;
	const program = new commander.Command( packageJson.name )
		.version( packageJson.version )
		.arguments( '<project-directory>' )
		.usage( `${chalk.green('<project-directory>')} [options]` )
		.action( name => {
			projectName = name;
		} )
		.option( '--verbose', 'print additional logs' )
		.option( '--info', 'print environment debug info' )
		.option( '--use-npm' )
		.allowUnknownOption()
		.on( '--help', () => {
			console.log( `    Only ${chalk.green('<project-directory>')} is required.` );
			console.log();
			console.log(
				`    If you have any problems, do not hesitate to file an issue:`
			);
			console.log(
				`      ${chalk.cyan(
					'https://github.com/humanmade/react-wp-scripts/issues/new'
				)}`
			);
			console.log();
		} )
		.parse( process.argv );

	if ( typeof projectName === 'undefined' ) {
		if (program.info) {
			envinfo.print( {
				packages:    ['react', 'react-dom', 'react-wp-scripts'],
				noNativeIDE: true,
				duplicates:  true,
			} );
			process.exit( 0 );
		}
		console.error( 'Please specify the project directory:' );
		console.log(
			`  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
		);
		console.log();
		console.log( 'For example:' );
		console.log( `  ${chalk.cyan(program.name())} ${chalk.green('my-react-app')}` );
		console.log();
		console.log(
			`Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
		);
		process.exit( 1 );
	}

	// Resolve the supplied path into an actual name.
	const fullProjectPath = path.resolve( process.cwd(), projectName );
	const autoNamespace = upperCamelCase( path.basename( fullProjectPath ) );

	// Run create-react-app with all the additional arguments.
	runCRA( args.slice( 2 ), autoNamespace )
		.then( () => runAdditionalScripts(
			projectType,
			projectName,
			autoNamespace,
		) )
		.catch( reason => {
			console.log();
			console.log( 'Aborting installation.' );
			if ( reason.command ) {
				console.log( `  ${chalk.cyan(reason.command)} has failed.` );
			} else {
				console.log( chalk.red( 'Unexpected error. Please report it as a bug:' ) );
				console.log( reason );
			}
			console.log();

			// On 'exit' we will delete these files from target directory.
			const knownGeneratedFiles = [
				'functions.php',
				'style.css',
				'plugin.php',
			];
			const currentFiles = fs.readdirSync(path.join(root));
			currentFiles.forEach(file => {
				knownGeneratedFiles.forEach(fileToMatch => {
					// This will catch `(npm-debug|yarn-error|yarn-debug).log*` files
					// and the rest of knownGeneratedFiles.
					if (
						(fileToMatch.match(/.log/g) && file.indexOf(fileToMatch) === 0) ||
						file === fileToMatch
					) {
						console.log(`Deleting generated file... ${chalk.cyan(file)}`);
						fs.removeSync(path.join(root, file));
					}
				});
			});
		} );
}

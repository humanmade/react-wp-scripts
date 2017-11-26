const chalk = require( 'chalk' );
const { spawn } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );
const onExit = require( 'signal-exit' );
const overrideConfigCache = require( './override-start' );

const {
	choosePort,
	createCompiler,
	prepareProxy,
	prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const ASSET_FILENAME = 'asset-manifest.json'
const ASSET_FILE_PATH = path.join( process.cwd(), ASSET_FILENAME );

fs.readFile( ASSET_FILE_PATH, ( err, data ) => {
	if ( ! err ) {
		console.log( chalk.green( `${ ASSET_FILENAME } found: assuming dev server is already running.` ) );
		return;
	}

	choosePort( HOST, DEFAULT_PORT ).then( port => {
		if (port == null) {
			// We have not found a port.
			return;
		}
		const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';

		// Pass in the full hostname of the dev server.
		overrideConfigCache( `${ protocol }://${ HOST }:${ port }` );

		// Pass the selected port forward so that react-scripts' start will not re-prompt.
		process.env.PORT = port;

		// Load the parent start script now that configuration patching is complete.
		require( 'react-scripts/scripts/start' );

		// Before exit, delete the port file.
		onExit( () => fs.unlinkSync( ASSET_FILE_PATH ) );
	} );
} );

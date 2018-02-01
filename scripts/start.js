const chalk = require( 'chalk' );
const fs = require( 'fs' );
const path = require( 'path' );
const onExit = require( 'signal-exit' );
const overrideConfigCache = require( './override-start' );

const { choosePort } = require('react-dev-utils/WebpackDevServerUtils');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const ASSET_FILENAME = 'asset-manifest.json';
const ASSET_FILE_PATH = path.join( process.cwd(), ASSET_FILENAME );

fs.readFile( ASSET_FILE_PATH, ( err ) => {
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
		// Even though we bind to 0.0.0.0, we communicate "localhost".
		const host = HOST === '0.0.0.0' ? '127.0.0.1' : HOST;

		// Pass in the full hostname of the dev server.
		overrideConfigCache( `${ protocol }://${ host }:${ port }` );

		// Pass the selected port forward so that react-scripts' start will not re-prompt.
		process.env.PORT = port;
		// Do not attempt to load the dev server root in a new browser window.
		process.env.BROWSER = 'none';

		// Load the parent start script now that configuration patching is complete.
		require( 'react-scripts/scripts/start' );

		// Before exit, delete the port file.
		onExit( () => fs.unlinkSync( ASSET_FILE_PATH ) );
	} );
} );

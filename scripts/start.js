const chalk = require( 'chalk' );
const { spawn } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );
const onExit = require( 'signal-exit' );

const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const PORT_FILE = path.join( process.cwd(), 'react-port' );

fs.readFile( PORT_FILE, ( err, data ) => {
	if ( ! err ) {
		console.log( chalk.green( `Already running on port ${ data }` ) );
		return;
	}

	choosePort( HOST, DEFAULT_PORT ).then( port => {
		if (port == null) {
			// We have not found a port.
			return;
		}

		try {
			fs.writeFileSync( PORT_FILE, port );
		} catch ( err ) {
			console.log( chalk.red( `Unable to write port to ${ PORT_FILE }` ) );
			return;
		}

		const overridePath = require.resolve( './override-start' );
		const env = {
			PORT:    port,
			BROWSER: 'none',
		};
		const opts = {
			env:   Object.assign( {}, process.env, env ),
			stdio: 'inherit',
		};
		const proc = spawn(
			process.execPath,
			[ overridePath ],
			opts
		);

		// Before exit, delete the port file.
		onExit( code => fs.unlinkSync( PORT_FILE ) );
	} );
} );
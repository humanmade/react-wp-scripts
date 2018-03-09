#!/usr/bin/env node

const packageJson = require( './package.json' );
const run = require( '@humanmade/create-react-wp-project' );

run( 'theme', packageJson );

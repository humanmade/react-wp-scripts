/**
 * This file **must** be imported before anything else in
 * your app to ensure URLs are correctly resolved.
 */

if ( process.env.NODE_ENV === 'production' ) {
	// eslint-disable-next-line
	__webpack_public_path__ = %%PUBLIC_PATH_VAR%%;
}

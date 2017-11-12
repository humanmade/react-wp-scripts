# react-wp-scripts

A wrapper for create-react-app's react-scripts to allow seamless usage in a theme (and maybe plugins in the future?).

**Do not use this.**

## Usage

Add as a package from git, then change your `start` script in `package.json` to:

```
react-wp-scripts/bin/react-wp-scripts.js start
```

Copy `loader.php` to your WP project, and add the loader file:

```php
require __DIR__ . '/loader.php';

add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_assets' );

function enqueue_assets() {
	\ReactWPScripts\enqueue_assets( 'nameoftheme', [ 'any',  'dependencies' ] );
}
```
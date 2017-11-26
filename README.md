# react-wp-scripts

A wrapper for create-react-app's `react-scripts` to allow seamless usage of scripts and styles served from `webpack-dev-server` while developing a theme or plugin.

**Important Note**: This project is brand new, and largely untested. We recommend using it as a learning tool rather than depending on it for critical development work.

## Installation & Usage

From the root directory of your `create-react-app`-generated project, run

```sh
npm install humanmade/react-wp-scripts
```

Once installed, change your `start` script in `package.json` from

```
"start": "react-scripts start",
```
to
```
"start": "react-wp-scripts start",
```

Copy `loader.php` to your project (_e.g._ `cp node_modules/react-wp-scripts/loader.php .` on OSX/Linux), then copy this code into your theme or plugin:

```php
require __DIR__ . '/loader.php';

function enqueue_assets() {
	\ReactWPScripts\enqueue_assets( 'nameoftheme', [ 'any', 'dependencies' ] );
}
add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\\enqueue_assets' );
```

This will enqueue `http://localhost:[active port]/static/js/bundle.js` to load in your theme or plugin.

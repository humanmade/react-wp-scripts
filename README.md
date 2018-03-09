# react-wp-scripts

A wrapper for create-react-app's [`react-scripts`](https://github.com/facebookincubator/create-react-app/tree/master/packages/react-scripts) to allow seamless usage of scripts and styles served from `webpack-dev-server` while developing a theme or plugin.

`react-wp-scripts` includes `create-react-wp-plugin` and `create-react-wp-theme`, which work just like [`create-react-app`](https://github.com/facebook/create-react-app).

## Easy Setup

The easiest way to get started with `react-wp-scripts` for new projects is to use the setup command to create a new project:

```sh
# For plugins:
npx create-react-wp-plugin my-app

# For themes:
npx create-react-wp-theme my-app
```

You'll get a plugin or theme ready to activate in WordPress. You'll also want to start the JS development server:

```sh
cd my-app
npm start
```

You can use any of the normal `react-scripts` [commands](https://github.com/facebookincubator/create-react-app/blob/master/README.md#npm-start-or-yarn-start) as normal while you develop.

### Adding to an Existing Project

If you already have a project created with `create-react-app`, you can easily switch it to `react-wp-scripts`:

```sh
npm install --save react-wp-scripts
```

You'll need to edit the `scripts` in your `package.json`. Replace `react-scripts` with `react-wp-scripts`:

```json
  "scripts": {
    "start": "react-wp-scripts start",
    "build": "react-wp-scripts build",
    "test": "react-wp-scripts test --env=jsdom",
    "eject": "react-wp-scripts eject"
  }
```

Finally, you'll need to load your assets into WordPress. Copy [the loader file](packages/react-wp-scripts/template/common/loader.php) into your project, and replace `%%NAMESPACE%%` with your desired namespace. Then, hook it in to WordPress:

```php
require __DIR__ . '/react-wp-scripts.php';

function myproject_enqueue_assets() {
	// In a theme, pass in the stylesheet directory:
	\ReactWPScripts\enqueue_assets( get_stylesheet_directory() );

	// In a plugin, pass the plugin dir path:
	\ReactWPScripts\enqueue_assets( plugin_dir_path( __FILE__ ) );
}
add_action( 'wp_enqueue_scripts', 'myproject_enqueue_assets' );
```

This will load all generated JS and CSS into your theme or plugin.

## PHP Interface

### `enqueue_assets`

The `enqueue_assets` function takes two arguments: the filesystem path to the project directory containing the `src` and `build` folders, and an optional array argument which may be used to customize script handles and dependencies. Available options:

- `base_url`: The URL of the project base that contains the `src` and `build` directories. If not specified, this URL will be inferred from the provided directory path string.
- `handle`: The handle to use when registering the app's script and stylesheet. This will default to the last part of the directory passed to enqueue_assets.
- `scripts`: An array of script dependencies to load before your bundle.
- `styles`: An array of stylesheet dependencies to load before your bundle.

## How It Works

This project solves two issues that prevent seamless usage of Webpack projects in WordPress themes and plugins:

1. WordPress doesn't necessarily know where to look for the output bundles.
2. WordPress cannot access the development server due to cross-origin restrictions.

When you run `npm run build` in a `create-react-app` project, `react-scripts` uses the [`webpack-manifest-plugin`](https://github.com/danethurber/webpack-manifest-plugin) to output an `assets-manifest.json` file containing the paths of all generated assets. Since files are generated with content hashes in their filename, this file can be ingested from PHP to ensure we are enqueueing the right scripts or styles for our application.

Running `npm start`, on the other hand, doesn't output a thing: this is because [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server) compiles files in-memory and does not write anything to disk, but also because the development webpack configuration does not contain that `webpack-manifest-plugin` (as the output files have no hash). If the dev server used a static host and port we could hard-code the URIs for those development bundles into our WordPress themes and plugins, but `react-scripts` tries to pick an unused port for your server so the port may change.

`react-wp-scripts` wraps the default `react-scripts` "start" command with code that tweaks the development Webpack and `webpack-dev-server` configuration objects, injecting cross-origin headers, a `webpack-manifest-plugin` plugin configured to output from within `webpack-dev-server`, and other optimizations to allow WordPress and the Webpack build to properly communicate. All successful builds will now create an `assets-manifest.json` file, either at the project root (when the development server is running) or in the `build/` directory (as part of a static build).

Finally, the PHP in `loader.php` uses the location of the generated `assets-manifest.json` file to enqueue scripts either from the development server or from the static `build/` directory.

## Troubleshooting

### Server will not start

If the development server will not start or WordPress is showing script errors, try deleting the `assets-manifest.json` in the project root then re-start the development server.

### Scripts do not load

If the development server is not running, the root `assets-manifest.json` is not present, and scripts still will not load, re-run `npm run build` to re-generate any build assets that may be missing.

### Fatal Error: Cannot redeclare ReactWPScripts...

If you get an error that you cannot reduplicate a method in the `ReactWPScripts` namespace, the cause is likely that two copies of `loader.php` are present in separate plugins or themes. Switch the copy in the plugin or theme under development to use a different namespace to avoid collision.

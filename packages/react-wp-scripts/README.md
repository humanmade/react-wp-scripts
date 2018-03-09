# react-wp-scripts User Guide

`react-wp-scripts` is a wrapper for create-react-app's [`react-scripts`](https://github.com/facebookincubator/create-react-app/tree/master/packages/react-scripts) to allow seamless usage of scripts and styles in WordPress while developing a theme or plugin.

`react-wp-scripts` projects are just like Create React App projects, so you should read [Create React App's User Guide](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md) for most questions.

This user guide is specifically for the `react-wp-scripts`-specific code.


## PHP Interface

### `enqueue_assets`

The `enqueue_assets` function takes two arguments: the filesystem path to the project directory containing the `src` and `build` folders, and an optional array argument which may be used to customize script handles and dependencies. Available options:

- `base_url`: The URL of the project base that contains the `src` and `build` directories. If not specified, this URL will be inferred from the provided directory path string.
- `handle`: The handle to use when registering the app's script and stylesheet. This will default to the last part of the directory passed to enqueue_assets.
- `scripts`: An array of script dependencies to load before your bundle.
- `styles`: An array of stylesheet dependencies to load before your bundle.


## Troubleshooting

### Server will not start

If the development server will not start or WordPress is showing script errors, try deleting the `assets-manifest.json` in the project root then re-start the development server.

### Scripts do not load

If the development server is not running, the root `assets-manifest.json` is not present, and scripts still will not load, re-run `npm run build` to re-generate any build assets that may be missing.

### Fatal Error: Cannot redeclare ReactWPScripts...

If you get an error that you cannot reduplicate a method in the `ReactWPScripts` namespace, the cause is likely that two copies of `loader.php` are present in separate plugins or themes. Switch the copy in the plugin or theme under development to use a different namespace to avoid collision.

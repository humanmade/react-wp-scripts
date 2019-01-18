const getConfig = require("react-scripts/config/webpack.config.js");
const { GenerateSW } = require("workbox-webpack-plugin");
const applyWpConfig = require("../overrides/applyWpConfig");

module.exports = function(webpackEnv) {
  const config = getConfig(webpackEnv);

  if (webpackEnv === "production") {
    // Remove default Workbox plugin.
    config.plugins = config.plugins.filter(
      plugin => !(plugin instanceof GenerateSW)
    );

    // Generate a service worker script that will precache, and keep up to date,
    // the HTML & assets that are part of the Webpack build without the navigation
    // fallback.
    config.plugins.push(
      new GenerateSW({
        clientsClaim: true,
        exclude: [/\.map$/, /asset-manifest\.json$/],
        importWorkboxFrom: "cdn",
      })
    );
  }

  return applyWpConfig(config);
};

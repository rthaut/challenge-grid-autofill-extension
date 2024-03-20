/* global require */
const path = require("path");
const webpack = require("webpack");

/* global module */
module.exports = {
  webpack: (config, { dev, vendor }) => {
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
        },
      ],
    };

    // TODO: should we drop the aliases and just use actual relative paths? if not, should we alias the `scripts` directory instead? (would also need to update jsconfig.json to match)
    config.resolve = {
      alias: {
        utils: path.resolve(__dirname, "app/scripts/utils/"),
      },
      extensions: [".js", ".json", ".jsx"],
    };

    // TODO: it would be nice to drop the polyfill, but it seems chrome still only recognizes the `chrome` namespace...
    if (["chrome", "opera", "edge"].includes(vendor)) {
      config.plugins.push(
        new webpack.ProvidePlugin({
          browser: "webextension-polyfill",
        })
      );
    }

    return config;
  },
};

/* global require */
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

/* global module */
module.exports = {
  webpack: (config, { dev }) => {
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

    config.optimization = {
      ...config.optimization,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              pure_funcs: [
                // drop all console functions except errors
                "console.assert",
                "console.clear",
                "console.count",
                "console.countReset",
                "console.debug",
                "console.dir",
                "console.dirxml",
                //"console.error",
                //"console.exception",
                "console.group",
                "console.groupCollapsed",
                "console.groupEnd",
                "console.info",
                "console.log",
                "console.profile",
                "console.profileEnd",
                "console.table",
                "console.time",
                "console.timeEnd",
                "console.timeLog",
                "console.timeStamp",
                "console.trace",
                "console.warn",
              ],
            },
          },
        }),
      ],
    };

    config.resolve = {
      alias: {
        utils: path.resolve(__dirname, "app/scripts/utils/"),
      },
      extensions: [".js", ".json", ".jsx"],
    };

    return config;
  },
};

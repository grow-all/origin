module.exports = (api, options) => {
  api.registerCommand(
    "build",
    {
      description: "build for production",
      usage: "gas build [options] [entry]",
      options: {
        "--mode": `specify env mode (default: production)`,
        "--dest": `specify output directory (default: ${options.outputDir})`,
        "--skip-plugins": `comma-separated list of plugin names to skip for this run`
      }
    },
    async function build(args) {
      args.entry = args.entry || args._[0];

      const path = require("path");
      const webpack = require("webpack");
      const { logger } = require("@grow-all/cli-share-utils");
      const formatStats = require("./formatStats");

      const config = api.resolveChainableWebpackConfig();
      let targetDir = api.resolve(options.outputDir);
      // respect inline build destination in copy plugin
      if (args.dest) {
        options.outputDir = args.dest;
        targetDir = api.resolve(args.dest);
        if (config.plugins.has("CopyWebpackPlugin")) {
          config.plugin("CopyWebpackPlugin").tap(pluginArgs => {
            pluginArgs[0][0].to = targetDir;
            return pluginArgs;
          });
        }
      }

      const webpackConfig = api.resolveWebpackConfig(config);

      if (args.entry) {
        webpackConfig.entry = { app: api.resolve(args.entry) };
      }

      return new Promise((resolve, reject) => {
        webpack(webpackConfig, (err, stats) => {
          if (err) {
            reject(err);
          }

          if (stats.hasErrors()) {
            reject("Build faild with errors.");
          }

          const targetDirShort = path.relative(api.service.context, targetDir);
          logger.log(formatStats(stats, targetDirShort, api));
          logger.done("Build complete. Watching for changes...");
          resolve();
        });
      });
    }
  );
};

module.exports.defaultModes = {
  build: "production"
};

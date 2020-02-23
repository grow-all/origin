const { logger, openBrowser } = require("@grow-all/cli-share-utils");

const defaults = {
  host: "0.0.0.0",
  port: "8080",
  https: false // TODO
};
/**
 * @param {object} api - A PluginAPI instance.
 * @param {object} options - projectOptions
 */
module.exports = (api, options) => {
  api.registerCommand(
    "serve",
    {
      description: "start development server",
      usage: "gas serve [options] [entry]",
      options: {
        "--open": `open browser on the server start`,
        "--mode": `specify env mode (default: development)`,
        "--host": `specify host (default: ${defaults.host})`,
        "--port": `specify port (default: ${defaults.port})`,
        "--public": `specify the public network URL for the HMR client`, // ?
        "--skip-plugins": `comma-spearated list of plugin names to skip for this run`
      }
    },
    async function serve(args) {
      logger.info(`Starting development server...`);

      const isProduction = process.env.NODE_ENV === "production";

      const webpack = require("webpack");
      const WebpackDevServer = require("webpack-dev-server");
      const portfinder = require("portfinder");
      const { chalk } = require("@grow-all/cli-share-utils");
      const prepareURLs = require("../util/prepareURLs");
      const isAbsoluteUrl = require("../util/isAbsoluteUrl");
      const webpackConfig = api.resolveWebpackConfig();

      // TODO check for common config errors

      // load user devServer options with higher priority than deServer
      // in Webpack config
      const projectDevServerOptions = Object.assign(
        webpackConfig.devServer || {},
        options.devServer
      );

      // TODO expose advanced stats

      // entry arg
      const entry = args._[0];
      if (entry) {
        webpackConfig.entry = {
          app: api.resolve(entry)
        };
      }

      const protocol = "http"; // TODO https
      const host = args.host || projectDevServerOptions.host || defaults.host;
      portfinder.basePort =
        args.port || projectDevServerOptions.port || defaults.port;
      const port = await portfinder.getPortPromise();
      const rawPublicUrl = args.public || projectDevServerOptions.public;
      const publicUrl = rawPublicUrl
        ? /^[a-zA-Z]+:\/\//.test(rawPublicUrl)
          ? rawPublicUrl
          : `${protocol}://${rawPublicUrl}`
        : null;

      const urls = prepareURLs(
        protocol,
        host,
        port,
        isAbsoluteUrl(options.publicPath) ? "/" : options.publicPath
      );
      const localUrlForBrowser = publicUrl || urls.localUrlForBrowser;

      // TODO proxy

      // https://github.com/webpack/webpack-dev-server/blob/master/examples/api/simple/server.js
      const compiler = webpack(webpackConfig);
      const server = new WebpackDevServer(
        compiler,
        Object.assign(
          {
            clientLogLevel: "silent",
            contentBase: api.resolve("public"),
            watchContentBase: !isProduction,
            hot: !isProduction,
            publicPath: options.publicPath,
            open: false
          },
          projectDevServerOptions
        )
      );

      ["SIGINT", "SIGTERM"].forEach(signal => {
        process.on(signal, () => {
          server.close(() => {
            process.exit(0);
          });
        });
      });

      return new Promise((resolve, reject) => {
        // log instructions & open browser on first compilation complete
        let isFirstCompile = true;
        compiler.hooks.done.tap("grow-all-script serve", stats => {
          if (stats.hasErrors()) {
            return;
          }

          const networkUrl = publicUrl
            ? publicUrl.replace(/([^/])$/, "$1/")
            : urls.lanUrlForTerminal;

          console.log();
          console.log(` App running at:`);
          console.log(` -- Local:    ${chalk.cyan(urls.localUrlForTerminal)}`);
          console.log(` -- Network:   ${chalk.cyan(networkUrl)}`);
          console.log();

          if (isFirstCompile) {
            isFirstCompile = false;

            if (args.open || projectDevServerOptions.open) {
              openBrowser(localUrlForBrowser);
            }

            // resolve returned Promise
            // so other commands can do api.service.run('serve').then
            resolve({
              server,
              url: localUrlForBrowser
            });
          }
        });

        server.listen(port, host, err => {
          if (err) {
            reject(err);
          }
        });
      });
      // return new Promise((resolve, reject) => {
      //   webpack(webpackConfig, (err, stats) => {
      //     if (err) {
      //       reject(new Error(err.stack()))
      //     } else if ((stats.hasErrors())) {
      //       let errMsg = ''
      //       stats.toString({
      //         colors: true,
      //         assets: false,
      //         modules: false,
      //         children: true,
      //         chunks: true,
      //         chunkModules: true,
      //         entrypoints: true
      //       })
      //         .split(/\r?\n/)
      //         .forEach((line) => {
      //           errMsg += `    ${line}\n`
      //         })

      //       reject(new Error(errMsg))
      //     } else {
      //       resolve(stats.toString({
      //         colors: true,
      //         modules: false,
      //         children: false,
      //         chunks: false,
      //         chunkModules: false,
      //         entrypoints: false
      //       }))
      //     }
      //   })
      // })
    }
  );
};

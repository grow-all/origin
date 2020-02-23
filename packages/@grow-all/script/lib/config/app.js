const fs = require("fs");
const path = require("path");

module.exports = (api, options) => {
  api.chainWebpack(webpackConfig => {
    if (
      process.env.GROW_ALL_CLI_BUILD_TARGET &&
      process.env.GROW_ALL_CLI_BUILD_TARGET !== "app"
    ) {
      return;
    }

    const isProd = process.env.NODE_ENV === "production";
    const HtmlWebpackPlugin = require("html-webpack-plugin");
    const outputDir = api.resolve(options.outputDir);
    const htmlPath = api.resolve("public/index.html");
    const defaultHtmlPath = path.resolve(__dirname, "index.default.html");

    // TODO mutiPage
    const htmlOptions = {
      title: api.service.pkg.name,
      filename: "index.html",
      template: fs.existsSync(htmlPath) ? htmlPath : defaultHtmlPath,
      minify: isProd
        ? {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            collapseBooleanAttributes: true,
            removeScriptTypeAttributes: true
            // more options:
            // https://github.com/kangax/html-minifier#options-quick-reference
          }
        : false
    };

    const publicCopyIgnore = [
      ".DS_Store",
      {
        glob: path.relative(
          api.resolve("public"),
          api.resolve(htmlOptions.template)
        )
      }
    ];

    webpackConfig
      .plugin("HtmlWebpackPlugin")
      .use(HtmlWebpackPlugin, [htmlOptions]);

    const publicDir = api.resolve("public");
    if (fs.existsSync(publicDir)) {
      webpackConfig
        .plugin("CopyWebpackPlugin")
        .use(require("copy-webpack-plugin"), [
          [
            {
              from: publicDir,
              to: outputDir,
              toType: "dir",
              ignore: publicCopyIgnore
            }
          ]
        ]);
    }
  });
};

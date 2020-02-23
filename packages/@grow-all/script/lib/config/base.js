module.exports = (api, options) => {
  api.chainWebpack(webpackConfig => {
    const resolveLocal = require("../util/resolveLocal");
    const getAssetsPath = require("../util/getAssetPath");
    const inlineLimit = 4096;

    const getAssetSubPath = dir => {
      return getAssetsPath(
        options,
        `${dir}/[name]${options.filenameHashing ? `.[hash:8]` : ""}.[ext]`
      );
    };

    const getUrlLoaderOptions = dir => {
      return {
        limit: inlineLimit,
        // use explicit fallback to avoid regression in url-loader>=1.1.0
        fallback: {
          loader: require.resolve("file-loader"),
          options: {
            name: getAssetSubPath(dir)
          }
        }
      };
    };

    webpackConfig
      .mode("development")
      .context(api.service.context)
      .entry("app")
      .add("./src/index.js")
      .end()
      .output.path(api.resolve(options.outputDir))
      .filename("[name].js")
      .publicPath(options.publicPath);

    webpackConfig.resolve.extensions
      .merge([".mjs", ".js", ".jsx", ".json"])
      .end()
      .modules.add("node_modules")
      .add(api.resolve("node_modules"))
      .add(resolveLocal("node_modules"))
      .end();

    webpackConfig.resolveLoader.modules
      .add("node_modules")
      .add(api.resolve("node_modules"))
      .add(resolveLocal("node_modules"));

    webpackConfig.module
      .rule("images")
      .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
      .use("url-loader")
      .loader("url-loader")
      .options(getUrlLoaderOptions("img"));

    webpackConfig.module
      .rule("media")
      .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/)
      .use("url-loader")
      .loader("url-loader")
      .options(getUrlLoaderOptions("media"));

    webpackConfig.module
      .rule("fonts")
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
      .use("url-loader")
      .loader("url-loader")
      .options(getUrlLoaderOptions("fonts"));

    webpackConfig.module
      .rule("js")
      .test(/\.m?jsx?$/)
      .exclude.add(filepath => {
        return /node_modules/.test(filepath);
      })
      .end()
      .use("babel-loader")
      .loader("babel-loader");
  });
};

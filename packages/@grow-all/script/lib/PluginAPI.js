const path = require("path");

module.exports = class PluginAPI {
  /**
   *
   * @param {string} id - Id of the plugin.
   * @param {Service} service - A grow-all-script instance.
   */
  constructor(id, service) {
    this.id = id;
    this.service = service;
  }

  registerCommand(name, opts, fn) {
    if (typeof opts === "function") {
      fn = opts;
      opts = null;
    }
    this.service.commands[name] = { fn, opts: opts || {} };
  }

  chainWebpack(fn) {
    this.service.webpackChainFns.push(fn);
  }

  configureWebpack(fn) {
    this.service.webpackRawConfigFns.push(fn);
  }

  resolveWebpackConfig(chainableConfig) {
    return this.service.resolveWebpackConfig(chainableConfig);
  }

  resolveChainableWebpackConfig() {
    this.service.resolveChainableWebpackConfig();
  }

  resolve(_path) {
    return path.resolve(this.service.context, _path);
  }
};

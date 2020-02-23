const path = require("path");
const fs = require("fs-extra");
const defaultsDeep = require("lodash.defaultsdeep");
const { logger } = require("@grow-all/cli-share-utils");
const readPkg = require("read-pkg");
const Config = require("webpack-chain");
const merge = require("webpack-merge");
const { defaults } = require("./options");
const PluginAPI = require("./PluginAPI");

module.exports = class Service {
  constructor(context) {
    this.initialized = false;
    this.context = context;
    this.commands = {};
    this.pkg = readPkg.sync({ cwd: context });
    this.projectOptions = {};
    this.webpackChainFns = [];
    this.webpackRawConfigFns = [];
    this.plugins = this.resolvePlugins();
    this.pluginsToSkip = new Set();
    this.modes = this.plugins.reduce((modes, { apply: { defaultModes } }) => {
      return Object.assign(modes, defaultModes);
    }, {});
  }

  init(mode) {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.mode = mode;
    process.env.NODE_ENV = mode || "development";
    const userOptions = this.loadUserOptions();
    this.projectOptions = defaultsDeep(userOptions, defaults());

    // apply plugins
    this.plugins.forEach(({ id, apply }) => {
      if (this.pluginsToSkip.has(id)) return;
      apply(new PluginAPI(id, this), this.projectOptions);
    });

    // apply webpack configs from project config file
    if (this.projectOptions.chainWebpack) {
      this.webpackChainFns.push(this.projectOptions.chainWebpack);
    }
    if (this.projectOptions.configureWebpack) {
      this.webpackRawConfigFns.push(this.projectOptions.configureWebpack);
    }
  }

  /**
   * 加载用户目录下 grow-all.config.js
   */
  loadUserOptions() {
    let fileConfig;
    const configPath = path.resolve(this.context, "grow-all.config.js");
    if (fs.existsSync(configPath)) {
      try {
        fileConfig = require(configPath);
        if (typeof fileConfig === "function") {
          fileConfig = fileConfig();
        }
        if (!fileConfig || typeof fileConfig !== "object") {
          logger.error(
            `Error loading grow-all.config.js: should export an object or a function that return object.`
          );
          fileConfig = null;
        }
      } catch (e) {
        logger.error(`Error loading grow-all.config.js`);
        throw e;
      }
    }
    return fileConfig;
  }

  async run(name, args = {}, rawArgv = {}) {
    const mode =
      args.mode ||
      (name === "build" && args.watch ? "development" : this.modes[name]);

    // TODO: setPluginsToSkip

    // load env variables, load user config, apply plugins
    this.init(mode);

    args._ = args._ || [];
    let command = this.commands[name];
    if (!command && name) {
      logger.error(`command "${name}" does not exist.`);
      process.exit(1);
    }
    if (!command || args.help || args.h) {
      command = this.commands.help;
    } else {
      args._.shift();
      rawArgv.shift();
    }
    const { fn } = command;
    return fn(args, rawArgv);
  }

  resolveChainableWebpackConfig() {
    const chainableConfig = new Config();
    // apply chains
    this.webpackChainFns.forEach(fn => fn(chainableConfig));
    return chainableConfig;
  }

  resolveWebpackConfig(chainableConfig = this.resolveChainableWebpackConfig()) {
    if (!this.initialized) {
      throw new Error(
        "Service must call init() before calling resolveWebpackConfig()"
      );
    }

    let config = chainableConfig.toConfig();
    const original = config;
    // apply raw config fns
    this.webpackRawConfigFns.forEach(fn => {
      if (typeof fn === "function") {
        const res = fn(config);
        if (res) {
          config = merge(config, res);
        }
      } else if (fn) {
        config = merge(config, fn);
      }
    });

    // #2206 If config is merged by webpack-merge, it discards the __ruleNames
    // information injected by webpack-chain. Restore the info so that
    // inspect works properly.
    if (config !== original) {
      cloneRuleNames(
        config.module && config.module.rules,
        original.module && original.module.rules
      );
    }

    // TODO 使用 grow-all.config.js 设 publicPath
    return config;
  }

  /**
   * TODO: inline Plugins && local Plugins
   */
  resolvePlugins() {
    const isPlugin = id => /^(@grow-all\/)cli-plugin-(.+)$/.test(id);
    const idToPlugin = id => ({
      id: id.replace(/^.\//, "built-in:"),
      apply: require(id)
    });

    let plugins;

    const builtInPlugins = [
      "./commands/serve",
      "./commands/build",
      "./commands/help",
      "./config/base",
      "./config/prod",
      "./config/app"
    ].map(idToPlugin);

    const projectPlugins = Object.keys(this.pkg.devDependencies || {})
      .concat(this.pkg.dependencies || {})
      .filter(isPlugin)
      .map(id => {
        if (
          this.pkg.optionalDependencies &&
          id in this.pkg.optionalDependencies
        ) {
          let apply = () => {};
          try {
            apply = require(id);
          } catch (e) {
            logger.warn(`Optional dependency ${id} is not installed.`);
          }
          return { id, apply };
        } else {
          return idToPlugin(id);
        }
      });
    plugins = builtInPlugins.concat(projectPlugins);
    return plugins;
  }
};

function cloneRuleNames(to, from) {
  if (!to || !from) {
    return;
  }
  from.forEach((r, i) => {
    if (to[i]) {
      Object.defineProperty(to[i], "__ruleNames", {
        value: r.__ruleNames
      });
      cloneRuleNames(to[i].oneOf, r.oneOf);
    }
  });
}

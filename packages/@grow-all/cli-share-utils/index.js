["module", "openBrowser"].forEach(m => {
  Object.assign(exports, require(`./lib/${m}`));
});

exports.chalk = require("chalk");
exports.semver = require("semver");
exports.execa = require("execa");
exports.logger = require("./lib/logger");

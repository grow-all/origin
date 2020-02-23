const chalk = require("chalk");

exports.log = msg => {
  console.log(msg);
};

exports.info = msg => {
  console.log(chalk.blue(msg));
};

exports.done = msg => {
  console.log(chalk.green(msg));
};

exports.error = msg => {
  console.error(chalk.red(msg));
};

exports.warn = msg => {
  console.warn(chalk.yellow(msg));
};

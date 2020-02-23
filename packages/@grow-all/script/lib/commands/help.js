const { chalk, logger } = require("@grow-all/cli-share-utils");
const getPadLength = require("../util/getPadLength");

/**
 * @param {object} api - A PluginAPI instance.
 * @param {object} options - projectOptions
 */
module.exports = api => {
  api.registerCommand("help", args => {
    const commandName = args._[0];
    if (!commandName) {
      logMainHelp();
    } else {
      logHelpForCommand(commandName, api.service.commands[commandName]);
    }
  });

  function logMainHelp() {
    console.log(`\n Usage: gas <command> [options]\n` + `\n Commands:\n`);
    const commands = api.service.commands;
    const padLength = getPadLength(commands);
    for (const name in commands) {
      if (name !== "help") {
        const opts = commands[name].opts || {};
        console.log(
          `    ${chalk.blue(name.padEnd(padLength))}${opts.description || ""}`
        );
      }
    }
    console.log(
      `\n  run ${chalk.green(
        `gas [command] --help`
      )} for usage of a specific command.\n`
    );
  }

  function logHelpForCommand(name, command) {
    if (!command) {
      logger.error(`\n command "${name}" does not exist.`);
    } else {
      const opts = command.opts || {};
      if (opts.usage) {
        console.log(`\n Usage: ${opts.usage}`);
      }
      if (opts.options) {
        console.log(`\n  Options:\n`);
        const padLength = getPadLength(opts.options);
        for (const [flags, description] of Object.entries(opts.options)) {
          console.log(
            `    ${chalk.blue(flags.padEnd(padLength))}${description}`
          );
        }
      }
      if (opts.details) {
        console.log();
        console.log(
          opts.details
            .split("\n")
            .map(line => `  ${line}`)
            .join("\n")
        );
      }
      console.log();
    }
  }
};

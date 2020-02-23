#!/usr/bin/env node
const program = require("commander");
const { chalk } = require("@grow-all/cli-share-utils");
const pkg = require("../package.json");

const enhanceErrorMessages = (methodName, log) => {
  program.Command.prototype[methodName] = function(...args) {
    if (methodName === "unknownOption" && this._allowUnknownOption) {
      return;
    }
    this.outputHelp();
    console.log(`  ` + chalk.red(log(...args)));
    console.log();
    process.exit(1);
  };
};

program.version(pkg.version).usage("<command> [options]");

program
  .command("create <app-name>")
  .description("create a new project")
  .option("-s, --skip-installDeps", "Skip install dependencies")
  .option("-f, --force", "Overwrite target directory if it exists")
  .option("-n, --no-git", "Skit git initialization")
  .action(async (name, cmd) => {
    const options = cleanArgs(cmd);
    require("../lib/commands/create")(name, options);
  });

program.arguments("<command>").action(cmd => {
  program.outputHelp();
  console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`));
  console.log();
});

program.on("--help", () => {
  console.log();
  console.log(
    `  Run ${chalk.cyan(
      `gac <command> --help`
    )} for detailed usage of given command.`
  );
  console.log();
});

program.commands.forEach(c => c.on("--help", () => console.log()));

enhanceErrorMessages("missingArgument", argName => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`;
});

enhanceErrorMessages("unknownOption", optionName => {
  return `Unknown option ${chalk.yellow(optionName)}.`;
});

enhanceErrorMessages("optionMissingArgument", (option, flag) => {
  return (
    `Missing required argument for option ${chalk.yellow(option.flags)}` +
    (flag ? `, got ${chalk.yellow(flag)}` : ``)
  );
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

function camelize(str) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ""));
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs(cmd) {
  const args = {};
  cmd.options.forEach(o => {
    // commander will remove '--no-' for '--no-xxxxxx'
    const key = camelize(o.long.replace(/^--(no-)?/, ""));
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== "function" && typeof cmd[key] !== "undefined") {
      args[key] = cmd[key];
    }
  });
  return args;
}

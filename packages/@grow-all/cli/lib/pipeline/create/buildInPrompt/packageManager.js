module.exports = (cli, cliOptions) => {
  cli.injectPrompt({
    name: "packageManager",
    type: "list",
    message: "请选择包管理器：",
    when: !["npm", "yarn"].includes(cliOptions.packageManager),
    choices: [
      {
        name: "Yarn",
        value: "yarn",
        short: "yarn",
        checked: true
      },
      {
        name: "NPM",
        value: "npm",
        short: "npm"
      }
    ]
  });
};

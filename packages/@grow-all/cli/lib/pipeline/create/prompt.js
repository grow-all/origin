const inquirer = require("inquirer");
const buildInPrompt = require("./buildInPrompt");

module.exports = async function execPrompt(creator) {
  const templateList = await creator.template.getTemplateList();
  const templateName = await promptForTemplate(templateList);
  const template = templateList.filter(t => {
    return (t.name = templateName);
  })[0];
  const { packageManager } = await buildInPrompt(creator);
  // 注入模板信息
  await creator.template.selectTemplate(template);
  const tplAnswers = await creator.applyPrompt();
  return {
    template,
    packageManager,
    ...tplAnswers
  };
};

async function promptForTemplate(templateList) {
  const choices = {};
  templateList.forEach(({ name, description, version }) => {
    // TODO 内置模板允许隐藏
    choices[name] = {
      name,
      description,
      version
    };
  });

  const maxLength = Object.keys(choices).reduce(
    (x, y) => Math.max(x, y.length),
    0
  );
  const templatePrompt = {
    name: "template",
    type: "list",
    message: "请选择模板：",
    choices: Object.values(choices).map(choice => {
      const name = `${choice.name.padEnd(maxLength, " ")} v${choice.version}${
        choice.description ? ` : ${choice.description}` : ""
      }`;
      return {
        name,
        value: choice.name
      };
    })
  };
  const prompt = inquirer.createPromptModule();
  const answer = await prompt(templatePrompt);
  return answer.template;
}

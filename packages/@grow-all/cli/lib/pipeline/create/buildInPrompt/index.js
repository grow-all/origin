// TODO 使用 vue ProjectPackageManager 自动选择 ?
// 是否要让用户进行选择？
const PromptModule = require("../../../Creator/PromptModule");
const packageManagerPrompt = require("./packageManager");

module.exports = async function buildInPrompt(creator) {
  const promptModule = new PromptModule(creator);
  promptModule.inject(packageManagerPrompt);
  return promptModule.ask();
};

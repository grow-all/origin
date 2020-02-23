const { logger } = require("@grow-all/cli-share-utils");

module.exports = async function generate(creator) {
  logger.info("正在生成文件...");
  await creator.applyGenerator();
  logger.info("生成文件完成!!!");
  // git init
  const { options } = creator;
  // TODO 完善是否初始化 git 的逻辑
  if (options.git !== false) {
    await creator.run("git init");
  }
  const packageManager = options.answers.packageManager;
  await creator.run(`${packageManager} install`);
};

const path = require("path");
const fs = require("fs-extra");
const { logger } = require("@grow-all/cli-share-utils");
const validateProjectName = require("validate-npm-package-name");
const Creator = require("../Creator");

async function create(projectName, options) {
  const cwd = process.cwd();
  const isCurrent = projectName === "";
  const name = isCurrent ? path.relative("../", cwd) : projectName;
  const targetDir = path.resolve(cwd, name || "");

  const result = validateProjectName(name);
  if (!result.validForNewPackages) {
    logger.error(`Invalid project name: ${name}`);
    result.errors &&
      result.errors.forEach(err => {
        logger.error(`Error: ${err}`);
      });
    result.warnings &&
      result.warnings.forEach(warn => {
        logger.error(`Warning: ${warn}`);
      });
    process.exit(1);
  }

  // TODO 允许覆盖已存在的目录
  if (fs.existsSync(targetDir)) {
    if (options.force) {
      fs.removeSync(targetDir);
    } else {
      logger.error(`目录：${targetDir} 已存在，请更换一个项目名称`);
      process.exit(1);
    }
  }

  const creator = new Creator(name, targetDir);
  await creator.create(options);
}

module.exports = (...args) => {
  return create(...args).catch(err => {
    console.log(err);
  });
};

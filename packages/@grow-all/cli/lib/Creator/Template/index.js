const path = require("path");
const { loadModule } = require("@grow-all/cli-share-utils");
const cliPkg = require("../../../package.json");

module.exports = class Template {
  constructor(creator) {
    this.creator = creator;
  }

  getTemplateList() {
    const buildInReg = /^@grow-all\/template-(.+)$/;
    const buildInTemplates = Object.keys(cliPkg.dependencies)
      .filter(pkgName => {
        return buildInReg.test(pkgName);
      })
      .map(pkgName => {
        const templatePkg = require(`${pkgName}/package.json`);
        const context = path.dirname(
          require.resolve(`${pkgName}/package.json`)
        );
        const templateName = pkgName.match(buildInReg)[1];
        return {
          name: templateName,
          description: templatePkg.description,
          version: templatePkg.version,
          isBuiltIn: true,
          context,
          info: templatePkg
        };
      });
    return buildInTemplates;
  }

  async selectTemplate(template) {
    const { info, context } = template;
    this.creator.invoke({
      name: info.name,
      prompt: loadModule("./prompt", context),
      generator: loadModule("./generator", context)
    });
    // TODO 遍历模板中的插件，收集里面的 prompt generator
  }
};

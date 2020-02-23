const GeneratorAPI = require("./GeneratorAPI");
const fs = require("fs-extra");
const path = require("path");
const { logger } = require("@grow-all/cli-share-utils");
const asyncFor = require("../../util/asyncFor");

class Generator {
  constructor(creator) {
    this.pkg = {};
    /**
     * @property files 文件列表
     */
    this.files = {};
    this.fileMiddlewares = [];
    this.creator = creator;
  }

  async inject({ name, pkgInfo, fn }) {
    const genApi = new GeneratorAPI(name, pkgInfo, this);
    logger.info(`正在执行来自 ${name} 的 Generate`);
    await fn(genApi, this.creator.options);
  }

  async resolveFiles() {
    const files = this.files;
    await asyncFor(this.fileMiddlewares, async fn => {
      await fn(files);
    });
    this.files["package.json"] = JSON.stringify(this.pkg, null, 2) + "\n";
  }

  async writeFileTree(targetDir) {
    Object.keys(this.files).forEach(name => {
      const filePath = path.resolve(targetDir, name);
      fs.ensureDirSync(path.dirname(filePath));
      fs.writeFileSync(filePath, this.files[name]);
    });
  }
}

module.exports = Generator;

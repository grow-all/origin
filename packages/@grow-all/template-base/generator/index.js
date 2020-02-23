const basePkg = require("./basePkg");

module.exports = async function(api, options) {
  const { answers } = options;
  const { ui } = answers;
  // 创建配置信息
  const config = basePkg;
  // 注入 @grow-all/script 用于调试、构建
  // Object.assign(config.devDependencies, {
  //   '@grow-all/script': "^0.1.0"
  // })
  if (ui === "antd") {
    config.dependencies.antd = "^3.26.9";
    Object.assign(config.devDependencies, {
      "babel-plugin-import": "^1.11.0"
    });
  }
  api.extendPackage(config);
  api.render("./template");
  // TODO 注册渲染完成回调
};

module.exports = cli => {
  cli.injectPrompt({
    name: "ui",
    type: "list",
    message: "请选择 UI 组件库：",
    choices: [
      {
        name: "ant design",
        value: "antd",
        short: "ant design"
      },
      {
        name: "无",
        value: "",
        short: "无"
      }
    ]
  });
};

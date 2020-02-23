module.exports = class PromptAPI {
  constructor() {
    this.featurePrompt = {
      name: "feature",
      type: "checkbox",
      message: "项目功能配置：",
      choices: []
    };

    this.injectPromptMap = new Map();
    this.beforePromptCbs = [];
    this.promptCompleteCbs = [];
  }

  injectFeature(choice) {
    this.featurePrompt.choices.push(choice);
  }

  injectPrompt(prompt) {
    this.injectPromptMap.set(prompt.name, prompt);
  }

  beforePrompt(cb) {
    this.beforePromptCbs.push(cb);
  }

  onPromptComplete(cb) {
    this.promptCompleteCbs.push(cb);
  }
};

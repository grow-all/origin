const PromptAPI = require("./PromptAPI");

module.exports = class PromptModule {
  constructor(creator) {
    this.promptAPI = new PromptAPI();
    this.creator = creator;
    this.options = creator.options;
    this.inquirer = creator.inquirer;
  }

  async ask() {
    const featurePrompt = this.featurePrompt;
    featurePrompt.when = !!featurePrompt.choices.length;
    const questions = [featurePrompt, ...this.injectedPrompts];
    this.execBeforePrompt(this.options);
    const answer = await this.inquirer.prompt(questions);
    this.execPromptComplete(answer, this.options);
    return answer;
  }

  async inject(fn) {
    await fn(this.promptAPI, this.options);
  }

  get featurePrompt() {
    return this.promptAPI.featurePrompt;
  }

  set featurePrompt(value) {
    throw new Error("set featurePrompt is forbidden, check your code");
  }

  get injectedPrompts() {
    return [...this.promptAPI.injectPromptMap.values()];
  }

  set injectedPrompts(value) {
    throw new Error("set injectedPrompts is forbidden, check your code");
  }

  execBeforePrompt(options) {
    this.promptAPI.beforePromptCbs.forEach(cb => cb(options));
  }

  execPromptComplete(answers, options) {
    this.promptAPI.promptCompleteCbs.forEach(cb => cb(answers, options));
  }
};

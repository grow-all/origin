const inquirer = require("inquirer");
const { execa } = require("@grow-all/cli-share-utils");
const Template = require("./Template");
const PromptModule = require("./PromptModule");
const promptPipeline = require("../pipeline/create/prompt");
const asyncFor = require("../util/asyncFor");
const Generator = require("./Generator");
const generate = require("../pipeline/create/generate");

module.exports = class Creator {
  constructor(name, context) {
    this.name = name;
    this.context = context;
    this.inquirer = inquirer;
    this.template = new Template(this);
    this.promptModule = new PromptModule(this);
    this.generator = new Generator(this);

    // 插件列表，模板也视为一个插件
    this.plugins = [];
    // 插件注入的提问函数
    this.injectPrompts = [];
    // 插件注入的生成器
    this.injectGenerators = [];
  }

  async invoke(plugin) {
    this.plugins.push(plugin);
    const { prompt, generator } = plugin;
    if (prompt) {
      this.injectPrompts.push(prompt);
    }
    if (generator) {
      this.injectGenerators.push({
        name: plugin.name,
        fn: generator,
        pkgInfo: plugin.pkgInfo
      });
    }
  }

  // 使用插件内 prompt 进行提问
  async applyPrompt() {
    await asyncFor(this.injectPrompts, async fn => {
      await this.promptModule.inject(fn);
    });
    return this.promptModule.ask();
  }

  // 使用插件内 generator 生成文件
  async applyGenerator() {
    this.generator.pkg = {
      name: this.name,
      version: "1.0.0"
    };
    await asyncFor(this.injectGenerators, async gen => {
      await this.generator.inject(gen);
    });
    // 处理文件信息
    await this.generator.resolveFiles();
    // 生成文件
    await this.generator.writeFileTree(this.context);
  }

  async create(options) {
    this.options = options;
    const answers = await promptPipeline(this);
    this.options.answers = answers;
    await generate(this);
  }

  async run(command, args) {
    if (!args) {
      [command, ...args] = command.split(/\s+/);
    }
    return execa(command, args, { cwd: this.context }).stdout.pipe(
      process.stdout
    );
  }
};

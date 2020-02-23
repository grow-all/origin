const path = require("path");
const fs = require("fs-extra");
const merge = require("deepmerge");
const { isBinarySync } = require("istextorbinary");
const { logger } = require("@grow-all/cli-share-utils");
const mergeDeps = require("../../util/mergeDeps");
const templateEngine = require("../../util/templateEngine");

const isString = val => typeof val === "string";
const isFunction = val => typeof val === "function";
const isObject = val => typeof val === "object";
const mergeArrayWithDedupe = (a, b) => Array.from(new Set([...a, ...b]));

function extractCallDir() {
  // extract api.render() callsite file location using error stack
  const obj = {};
  Error.captureStackTrace(obj);
  const callSite = obj.stack.split("\n")[3];
  const fileName = callSite.match(/\s\((.*):\d+:\d+\)$/)[1];
  return path.dirname(fileName);
}

class GeneratorAPI {
  /**
   *
   * @param {*} id 插件/模板名称
   * @param {*} pkgInfo
   * @param {*} generator generator实例
   */
  constructor(name, pkgInfo, generator) {
    this.name = name;
    /**
     * @property 插件/模板的 pkg
     */
    this.generator = generator;
    this.generatorPkg = pkgInfo;
    this.creator = generator.creator;
  }

  extendPackage(fields) {
    const pkg = this.generator.pkg;
    // 传递 package.json 信息，供各个插件使用
    const toMerge = isFunction(fields) ? fields(pkg) : fields;
    for (const key in toMerge) {
      const value = toMerge[key];
      const existing = pkg[key];
      if (
        isObject(value) &&
        (key === "dependencies" || key === "devDependencies")
      ) {
        pkg[key] = mergeDeps(this.name, existing || {}, value);
      } else if (!(key in pkg)) {
        pkg[key] = value;
      } else if (Array.isArray(value) && Array.isArray(existing)) {
        pkg[key] = mergeArrayWithDedupe(existing, value);
      } else if (isObject(value) && isObject(existing)) {
        pkg[key] = merge(existing, value, { arrayMerge: mergeArrayWithDedupe });
      } else {
        pkg[key] = value;
      }
    }
  }

  /**
   * inject a file processing middleware
   *
   * @private
   * @param {*} middleware
   */
  _injectFileMiddleware(middleware) {
    this.generator.fileMiddlewares.push(middleware);
  }

  /**
   * Resolves the data when rendering templates
   * @private
   * @param {object} [addtionalData]
   */
  _resolveData(addtionalData) {
    return Object.assign(
      {
        ...this.creator.options
      },
      addtionalData
    );
  }

  /**
   * 使用 nunjucks 作为模板引擎
   * render template files into the virtual files tree object
   *
   * @param {string | object | FileMiddleware} source
   *  can be one of:
   *  - relative path to a directory
   *  - Object hash of  { sourceTemplate: targetFile } mappings
   *  - a custom file middleware function
   * @param {object} [addtionalData] - addtional data available to templates
   */
  render(source, addtionalData = {}) {
    const baseDir = extractCallDir();
    if (isString(source)) {
      source = path.resolve(baseDir, source);
      this._injectFileMiddleware(async files => {
        const data = this._resolveData(addtionalData);
        const globby = require("globby");
        const _files = await globby(["**/*"], { cwd: source });
        // TODO 处理以 . 开头的文件
        for (const rawPath of _files) {
          const targetPath = rawPath
            .split("/")
            .map(filename => {
              // dotfiles are ignored when published to npm, therefore in templates
              // we need to use underscore instead (e.g. "_gitignore")
              if (filename.charAt(0) === "_" && filename.charAt(1) !== "_") {
                return `.${filename.slice(1)}`;
              }
              if (filename.charAt(0) === "_" && filename.charAt(1) === "_") {
                return `${filename.slice(1)}`;
              }
              return filename;
            })
            .join("/");
          const sourcePath = path.resolve(source, rawPath);
          const content = renderFile(sourcePath, data);
          if (Buffer.isBuffer(content) || /[^\s]/.test(content)) {
            files[targetPath] = content;
          }
        }
      });
    } else if (isObject(source)) {
      // TODO
    } else if (isFunction(source)) {
      // TODO
    }
  }
}

/**
 * 模板渲染
 * @param {*} sourcePath 文件路径
 * @param {*} options 渲染参数
 */
function renderFile(sourcePath, options) {
  if (isBinarySync(sourcePath) || options.isBinary) {
    return fs.readFileSync(sourcePath);
  }
  const template = fs.readFileSync(sourcePath, "utf-8");
  try {
    return templateEngine.renderString(template, options);
  } catch (error) {
    logger.error(`渲染 ${sourcePath} 文件失败`);
    logger.error(error);
    return null;
  }
}

module.exports = GeneratorAPI;

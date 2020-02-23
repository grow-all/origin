## lerna
文档 [lerna](https://github.com/lerna/lerna/)

### lerna init
`lerna init --independent` 初始化项目

### lerna create <name> [loc]
创建一个依赖包

> [loc] 参数无效，需要设置 `lerna.json` 里面的 `packages`，并且 `packages` 存在多个时有问题

### lerna add
`lerna add module1 --scope=module2`

### remove deps
lerna exec --scope=xxx yarn remove foo

[issue](https://github.com/lerna/lerna/issues/1886)
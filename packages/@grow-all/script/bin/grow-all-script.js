#!/usr/bin/env node
const { semver, logger } = require("@grow-all/cli-share-utils");
const Service = require("../lib/Service");

const requireedVersion = require("../package.json").engines.node;

if (!semver.satisfies(process.version, requireedVersion)) {
  logger.error(
    `You are using Node ${process.version}, but vue-cli-service ` +
      `requires Node ${requireedVersion}.\nPlease upgrade your Node version.`
  );
  process.exit(1);
}

const rawArgv = process.argv.slice(2);
const args = require("minimist")(rawArgv, {
  boolean: ["open"]
});

const command = args._[0];
const service = new Service(process.cwd());
service.run(command, args, rawArgv).catch(err => {
  logger.error(err);
  process.exit(1);
});

#!/usr/bin/env node

process.stdout.setEncoding("utf8");

import { program } from "commander";
import { runInit } from "../src/commands/init.js";
import { runSnapshot } from "../src/commands/snapshot.js";
import { runDiff } from "../src/commands/diff.js";
import { runCheck } from "../src/commands/check.js";
import { runList } from "../src/commands/list.js";

program
  .name("apidrift")
  .description("Detect API schema drift across environments")
  .version("1.0.0");

program
  .command("init")
  .description("Create a starter apidrift.config.json in current directory")
  .action(runInit);

program
  .command("snapshot")
  .description("Snapshot all endpoints for an environment")
  .requiredOption("--tag <tag>", "Version tag e.g. v1.0")
  .requiredOption("--env <env>", "Environment name e.g. staging")
  .action(runSnapshot);

program
  .command("diff")
  .description("Diff two snapshots by tag")
  .argument("<from>", "Base snapshot tag")
  .argument("<to>", "Target snapshot tag")
  .action(runDiff);

program
  .command("check")
  .description("Live diff two environments right now")
  .requiredOption("--envA <envA>", "First environment")
  .requiredOption("--envB <envB>", "Second environment")
  .action(runCheck);

program.command("list").description("List all saved snapshots").action(runList);

program.parse();

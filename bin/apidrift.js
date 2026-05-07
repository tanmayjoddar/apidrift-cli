#!/usr/bin/env node
import { program } from "commander";
import { runInit } from "../src/commands/init.js";
import { runSnapshot } from "../src/commands/snapshot.js";
import { runRecord } from "../src/commands/record.js";
import { runDiff } from "../src/commands/diff.js";
import { runCheck } from "../src/commands/check.js";
import { runList } from "../src/commands/list.js";

program
  .name("apidrift")
  .description("Detect API schema drift across environments")
  .version("1.0.2");

program
  .command("init")
  .description("Create a starter apidrift.config.json in current directory")
  .action(runInit);

program
  .command("snapshot")
  .description("Snapshot all endpoints for an environment or a single URL")
  .argument("[url]", "The URL to snapshot")
  .requiredOption("--tag <tag>", "Version tag e.g. v1.0")
  .option("--env <env>", "Environment name e.g. staging")
  .option(
    "--methods <methods>",
    "Comma-separated HTTP methods to allow during discovery/fetch (default: GET)",
  )
  .option("--dry-run", "Print endpoints that would be called (no requests)")
  .option("--delay <ms>", "Delay in ms between endpoint requests", "0")
  .action(runSnapshot);

program
  .command("record")
  .description("Create a snapshot from recorded traffic (stdin or HAR)")
  .requiredOption("--tag <tag>", "Version tag e.g. nightly")
  .option("--stdin", "Read input from stdin (supports HAR JSON or JSON lines)")
  .option("--har <file>", "Read a HAR file from disk")
  .action(runRecord);

program
  .command("diff")
  .description("Diff two snapshots by tag or two URLs")
  .argument("<from>", "Base snapshot tag or URL")
  .argument("<to>", "Target snapshot tag or URL")
  .option("--force", "Force comparison of different endpoints")
  .action(runDiff);

program
  .command("check")
  .description("Live diff two environments right now")
  .requiredOption("--envA <envA>", "First environment")
  .requiredOption("--envB <envB>", "Second environment")
  .option(
    "--methods <methods>",
    "Comma-separated HTTP methods to allow during discovery/fetch (default: GET)",
  )
  .option("--dry-run", "Print endpoints that would be called (no requests)")
  .option("--delay <ms>", "Delay in ms between endpoint checks", "0")
  .action(runCheck);

program.command("list").description("List all saved snapshots").action(runList);

program.parse();

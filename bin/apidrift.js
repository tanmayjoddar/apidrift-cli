import { program } from "commander";

program
  .name("apidrift")
  .description("API drift detection CLI")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize config")
  .action(() => {
    console.log("INIT WORKING.....");
  });

program.parse();

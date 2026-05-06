import chalk from "chalk";
import { listSnapshots } from "../storage/snapshotStore.js";

export function runList() {
  const snaps = listSnapshots();

  if (!snaps.length) {
    console.log(chalk.yellow("No snapshots found"));
    console.log("Run: apidrift snapshot --tag v1.0 --env staging");
    return;
  }

  console.log(chalk.bold("\nSaved snapshots:\n"));
  snaps.forEach((s) => console.log(`  ${chalk.cyan("→")} ${s}`));
  console.log("");
}

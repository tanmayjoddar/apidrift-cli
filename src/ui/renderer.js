import chalk from "chalk";
import Table from "cli-table3";

export function renderDiffReport(report, summary, from, to) {
  console.log("");
  console.log(
    chalk.bold(`apidrift diff: ${chalk.cyan(from)} → ${chalk.cyan(to)}`),
  );
  console.log("");

  for (const ep of report) {
    const label = `${chalk.gray(ep.method)} ${ep.endpoint}`;

    if (!ep.changes.length) {
      console.log(`${chalk.green("✓")} ${label} — ${chalk.green("clean")}`);
      continue;
    }

    console.log(`${chalk.red("✗")} ${label}`);

    const table = new Table({
      head: ["Field", "Change", "From", "To"],
      style: { head: ["cyan"] },
    });

    for (const change of ep.changes) {
      const icon =
        change.severity === "breaking"
          ? chalk.red("● breaking")
          : change.severity === "additive"
            ? chalk.yellow("◐ additive")
            : chalk.green("○ clean");

      table.push([
        chalk.white(change.path),
        icon,
        chalk.gray(JSON.stringify(change.from)),
        chalk.gray(JSON.stringify(change.to)),
      ]);
    }

    console.log(table.toString());
    console.log("");
  }

  console.log(chalk.bold("Summary"));
  console.log(`  ${chalk.red(`${summary.breaking} breaking`)}`);
  console.log(`  ${chalk.yellow(`${summary.additive} additive`)}`);
  console.log(`  Total changes: ${summary.total}`);
  console.log("");

  if (summary.hasBreakingChanges) {
    console.log(chalk.red.bold("✗ Breaking changes detected — deploy blocked"));
    process.exit(1); // ← CI/CD hook: non-zero exit = pipeline fails
  } else {
    console.log(chalk.green.bold("✓ No breaking changes"));
    process.exit(0);
  }
}

export function renderSnapshotSuccess(tag, env, count) {
  console.log("");
  console.log(
    chalk.green("✓") + chalk.bold(` Snapshot saved: ${chalk.cyan(tag)}`),
  );
  console.log(`  Environment : ${env}`);
  console.log(`  Endpoints   : ${count}`);
  console.log(`  Stored at   : ~/.apidrift/snapshots/${tag}.json`);
  console.log("");
}

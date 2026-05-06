import { loadSnapshot } from "../storage/snapshotStore.js";
import { diffSchemas } from "../core/differ.js";
import { classifyChanges, summarize } from "../core/classifier.js";
import { renderDiffReport } from "../ui/renderer.js";

export function runDiff(from, to) {
  const snapA = loadSnapshot(from);
  const snapB = loadSnapshot(to);

  const report = [];

  for (const epA of snapA.endpoints) {
    const epB = snapB.endpoints.find(
      (e) => e.endpoint === epA.endpoint && e.method === epA.method,
    );

    if (!epB) {
      report.push({
        endpoint: epA.endpoint,
        method: epA.method,
        changes: [],
        removed: true,
      });
      continue;
    }

    const rawChanges = diffSchemas(epA.schema, epB.schema);
    const changes = classifyChanges(rawChanges);
    report.push({ endpoint: epA.endpoint, method: epA.method, changes });
  }

  const allChanges = report.flatMap((r) => r.changes);
  const summary = summarize(allChanges);

  renderDiffReport(report, summary, from, to);
}

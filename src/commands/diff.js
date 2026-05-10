import { loadSnapshot } from "../storage/snapshotStore.js";
import { diffSchemas } from "../core/differ.js";
import { classifyChanges, summarize } from "../core/classifier.js";
import { renderDiffReport } from "../ui/renderer.js";
import { fetchEndpoint } from "../core/fetcher.js";
import { inferSchema } from "../core/inferSchema.js";
import { canonicalEndpoint } from "../utils/canonicalize.js";

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value));
}

async function fetchAndInfer(url) {
  const response = await fetchEndpoint(url, { path: "", method: "GET" });
  return inferSchema(response.data);
}

export async function runDiff(from, to, options = {}) {
  const force = Boolean(options.force);

  if (isHttpUrl(from) && isHttpUrl(to)) {
    const endpointA = canonicalEndpoint("GET", from);
    const endpointB = canonicalEndpoint("GET", to);

    if (endpointA !== endpointB && !force) {
      console.error("Error: Endpoints differ. Use --force to override.");
      console.error(`  - ${from} -> ${endpointA}`);
      console.error(`  - ${to} -> ${endpointB}`);
      process.exit(1);
    }

    const [resultA, resultB] = await Promise.allSettled([
      fetchAndInfer(from),
      fetchAndInfer(to),
    ]);

    if (resultA.status === "rejected") {
      console.error(`Error fetching ${from}: ${resultA.reason.message}`);
      process.exit(1);
    }
    if (resultB.status === "rejected") {
      console.error(`Error fetching ${to}: ${resultB.reason.message}`);
      process.exit(1);
    }

    const schemaA = resultA.value;
    const schemaB = resultB.value;
    const rawChanges = diffSchemas(schemaA, schemaB);
    const changes = classifyChanges(rawChanges);
    const summary = summarize(changes);

    renderDiffReport(
      [{ endpoint: from, method: "GET", changes }],
      summary,
      from,
      to,
    );
    return;
  }

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
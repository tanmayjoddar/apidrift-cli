import ora from "ora";
import { loadConfig } from "../config/loader.js";
import { fetchEndpoint } from "../core/fetcher.js";
import { inferSchema } from "../core/inferSchema.js";
import { diffSchemas } from "../core/differ.js";
import { classifyChanges, summarize } from "../core/classifier.js";
import { renderDiffReport } from "../ui/renderer.js";

export async function runCheck({ envA, envB }) {
  const config = loadConfig();
  const configA = config.environments[envA];
  const configB = config.environments[envB];

  if (!configA || !configB) {
    console.error("Unknown environment. Check your apidrift.config.json");
    process.exit(1);
  }

  const spinner = ora(`Live checking ${envA} vs ${envB}...`).start();
  const report = [];

  for (const endpoint of config.endpoints) {
    const [resA, resB] = await Promise.all([
      fetchEndpoint(configA.baseUrl, endpoint, configA.headers),
      fetchEndpoint(configB.baseUrl, endpoint, configB.headers),
    ]);

    const schemaA = inferSchema(resA.data);
    const schemaB = inferSchema(resB.data);
    const rawChanges = diffSchemas(schemaA, schemaB);
    const changes = classifyChanges(rawChanges);

    report.push({ endpoint: endpoint.path, method: endpoint.method, changes });
  }

  spinner.stop();

  const allChanges = report.flatMap((r) => r.changes);
  const summary = summarize(allChanges);

  renderDiffReport(report, summary, envA, envB);
}

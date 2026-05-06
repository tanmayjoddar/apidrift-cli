import ora from "ora";
import { loadConfig } from "../config/loader.js";
import { fetchEndpoint } from "../core/fetcher.js";
import { inferSchema } from "../core/inferSchema.js";
import { saveSnapshot } from "../storage/snapshotStore.js";
import { renderSnapshotSuccess } from "../ui/renderer.js";

export async function runSnapshot({ tag, env }) {
  const config = loadConfig();
  const environment = config.environments[env];

  if (!environment) {
    console.error(`Unknown environment: "${env}"`);
    console.error(`Available: ${Object.keys(config.environments).join(", ")}`);
    process.exit(1);
  }

  const spinner = ora(`Snapshotting ${env}...`).start();
  const results = [];

  for (const endpoint of config.endpoints) {
    try {
      const response = await fetchEndpoint(
        environment.baseUrl,
        endpoint,
        environment.headers,
      );
      const schema = inferSchema(response.data);
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        schema,
      });
    } catch (err) {
      spinner.fail(
        `Failed: ${endpoint.method} ${endpoint.path} — ${err.message}`,
      );
      process.exit(1);
    }
  }

  const snapshot = {
    tag,
    env,
    createdAt: new Date().toISOString(),
    endpoints: results,
  };

  saveSnapshot(tag, snapshot);
  spinner.stop();
  renderSnapshotSuccess(tag, env, results.length);
}

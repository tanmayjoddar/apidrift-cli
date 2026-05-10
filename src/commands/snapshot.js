import ora from "ora";
import { loadConfig } from "../config/loader.js";
import { discoverEndpoints } from "../discovery/index.js";
import { fetchEndpoint } from "../core/fetcher.js";
import { inferSchema } from "../core/inferSchema.js";
import { saveSnapshot } from "../storage/snapshotStore.js";
import { renderSnapshotSuccess } from "../ui/renderer.js";
import { canonicalizePathname } from "../utils/canonicalize.js";

function getDiscoverySettings(config) {
  const discovery = config?.discovery;
  if (typeof discovery === "string") {
    return { discovery, openapiUrl: undefined };
  }
  if (discovery && typeof discovery === "object") {
    if (typeof discovery.openapi === "string" && discovery.openapi.trim()) {
      return { discovery: "openapi", openapiUrl: discovery.openapi.trim() };
    }
    if (typeof discovery.mode === "string") {
      return { discovery: discovery.mode, openapiUrl: discovery.openapiUrl };
    }
  }
  return { discovery: "heuristic", openapiUrl: undefined };
}

export async function runSnapshot(url, { tag, env, methods, dryRun, delay }) {
  const allowedMethods = parseMethods(methods);
  const delayMs = parseDelay(delay);

  if (url) {
    if (dryRun) {
      console.log("");
      console.log("Dry run — would snapshot:");
      console.log(`  GET ${url}`);
      console.log("");
      return;
    }
    const spinner = ora(`Snapshotting URL: ${url}...`).start();
    try {
      const response = await fetchEndpoint(url, { path: "", method: "GET" });
      const schema = inferSchema(response.data);
      const canonicalizedUrl = canonicalizePathname(new URL(url).pathname);
      const snapshot = {
        tag,
        env: "url",
        createdAt: new Date().toISOString(),
        endpoints: [{ endpoint: canonicalizedUrl, method: "GET", schema }],
      };
      saveSnapshot(tag, snapshot);
      spinner.stop();
      renderSnapshotSuccess(tag, "url", 1);
    } catch (err) {
      spinner.fail(`Failed: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  if (!env) {
    console.error("Error: --env is required when not snapshotting a URL.");
    process.exit(1);
  }

  const config = loadConfig();
  const environment = config.environments[env];

  if (!environment) {
    console.error(`Unknown environment: "${env}"`);
    console.error(`Available: ${Object.keys(config.environments).join(", ")}`);
    process.exit(1);
  }

  const spinner = ora(`Snapshotting ${env}...`).start();
  const results = [];

  let endpoints = Array.isArray(config.endpoints) ? config.endpoints : [];
  if (endpoints.length === 0) {
    const settings = getDiscoverySettings(config);
    endpoints = await discoverEndpoints({
      discovery: settings.discovery,
      openapiUrl: settings.openapiUrl,
      baseUrl: environment.baseUrl,
      headers: environment.headers,
      methods: allowedMethods,
    });
  }

  endpoints = endpoints
    .map((e) => (typeof e === "string" ? { path: e, method: "GET" } : e))
    .map((e) => ({ ...e, method: String(e.method || "GET").toUpperCase() }))
    .filter((e) => allowedMethods.includes(e.method));

  if (!endpoints.length) {
    spinner.fail("No endpoints configured or discovered.");
    process.exit(1);
  }

  if (dryRun) {
    spinner.stop();
    console.log("");
    console.log(`Dry run — would snapshot ${env}:`);
    for (const ep of endpoints) {
      console.log(`  ${ep.method} ${ep.path}`);
    }
    console.log("");
    return;
  }

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    try {
      const response = await fetchEndpoint(
        environment.baseUrl,
        endpoint,
        environment.headers,
      );
      const schema = inferSchema(response.data);
results.push({
        endpoint: canonicalizePathname(endpoint.path),
        method: endpoint.method,
        schema,
      });

      if (delayMs > 0 && i < endpoints.length - 1) {
        await sleep(delayMs);
      }
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

function parseMethods(methodsOpt) {
  if (!methodsOpt) return ["GET"];
  const methods = String(methodsOpt)
    .split(",")
    .map((m) => m.trim().toUpperCase())
    .filter(Boolean);
  return methods.length ? Array.from(new Set(methods)) : ["GET"];
}

function parseDelay(delayOpt) {
  if (delayOpt === undefined || delayOpt === null || delayOpt === "") return 0;
  const delay = Number(delayOpt);
  if (!Number.isFinite(delay) || delay < 0) {
    console.error("Error: --delay must be a non-negative number (ms).");
    process.exit(1);
  }
  return Math.floor(delay);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

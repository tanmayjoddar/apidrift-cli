import ora from "ora";
import { loadConfig } from "../config/loader.js";
import { discoverEndpoints } from "../discovery/index.js";
import { fetchEndpoint } from "../core/fetcher.js";
import { inferSchema } from "../core/inferSchema.js";
import { diffSchemas } from "../core/differ.js";
import { classifyChanges, summarize } from "../core/classifier.js";
import { renderDiffReport } from "../ui/renderer.js";
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

export async function runCheck({ envA, envB, methods, dryRun, delay }) {
  const config = loadConfig();
  const configA = config.environments[envA];
  const configB = config.environments[envB];

  const allowedMethods = parseMethods(methods);
  const delayMs = parseDelay(delay);

  if (!configA || !configB) {
    console.error("Unknown environment. Check your apidrift.config.json");
    process.exit(1);
  }

  const spinner = ora(`Live checking ${envA} vs ${envB}...`).start();
  const report = [];

  let endpoints = Array.isArray(config.endpoints) ? config.endpoints : [];
  if (endpoints.length === 0) {
    const settings = getDiscoverySettings(config);
    endpoints = await discoverEndpoints({
      discovery: settings.discovery,
      openapiUrl: settings.openapiUrl,
      baseUrl: configA.baseUrl,
      headers: configA.headers,
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
    console.log(`Dry run — would check ${envA} vs ${envB}:`);
    for (const ep of endpoints) {
      console.log(`  ${ep.method} ${ep.path}`);
    }
    console.log("");
    process.exit(0);
  }

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];

    const [resultA, resultB] = await Promise.allSettled([
      fetchEndpoint(configA.baseUrl, endpoint, configA.headers),
      fetchEndpoint(configB.baseUrl, endpoint, configB.headers),
    ]);

    if (resultA.status === "rejected" || resultB.status === "rejected") {
      const reason = resultA.status === "rejected"
        ? resultA.reason.message
        : resultB.reason.message;
      console.error(`  Skipped ${endpoint.method} ${endpoint.path}: ${reason}`);
      continue;
    }

    const resA = resultA.value;
    const resB = resultB.value;

    const schemaA = inferSchema(resA.data);
    const schemaB = inferSchema(resB.data);
    const rawChanges = diffSchemas(schemaA, schemaB);
    const changes = classifyChanges(rawChanges);

    report.push({ endpoint: canonicalizePathname(endpoint.path), method: endpoint.method, changes });

    if (delayMs > 0 && i < endpoints.length - 1) {
      await sleep(delayMs);
    }
  }

  spinner.stop();

  const allChanges = report.flatMap((r) => r.changes);
  const summary = summarize(allChanges);

  renderDiffReport(report, summary, envA, envB);
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

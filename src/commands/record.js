import fs from "fs";
import ora from "ora";

import { canonicalEndpoint } from "../utils/canonicalize.js";
import { inferSchema } from "../core/inferSchema.js";
import { maskSensitiveData } from "../core/masker.js";
import { mergeSchema } from "../core/mergeSchema.js";
import { saveSnapshot } from "../storage/snapshotStore.js";
import { renderSnapshotSuccess } from "../ui/renderer.js";

export async function runRecord({ tag, stdin, har }) {
  if (!tag) {
    console.error("Error: --tag is required");
    process.exit(1);
  }

  const inputText = await readInput({ stdin, har });

  const spinner = ora(`Recording traffic into snapshot: ${tag}...`).start();

  try {
    const observations = parseTrafficInput(inputText);

    if (observations.length === 0) {
      spinner.fail("No usable JSON responses found in input.");
      process.exit(1);
    }

    const byEndpoint = new Map();

    for (const obs of observations) {
      const method = String(obs.method || "GET").toUpperCase();
      const url = String(obs.url || "");
      if (!url) continue;

      const key = canonicalEndpoint(method, url);
      const endpointPath = key.slice(key.indexOf(" ") + 1);

      const masked = maskSensitiveData(obs.body);
      const schema = inferSchema(masked);

      const existing = byEndpoint.get(key);
      if (!existing) {
        byEndpoint.set(key, {
          endpoint: endpointPath,
          method,
          schema,
        });
      } else {
        existing.schema = mergeSchema(existing.schema, schema);
      }
    }

    const endpoints = Array.from(byEndpoint.values()).sort((a, b) => {
      if (a.method !== b.method) return a.method.localeCompare(b.method);
      return a.endpoint.localeCompare(b.endpoint);
    });

    if (endpoints.length === 0) {
      spinner.fail("No usable endpoints found after parsing.");
      process.exit(1);
    }

    const snapshot = {
      tag,
      env: "record",
      createdAt: new Date().toISOString(),
      endpoints,
    };

    saveSnapshot(tag, snapshot);
    spinner.stop();
    renderSnapshotSuccess(tag, "record", endpoints.length);
  } catch (err) {
    spinner.fail(`Failed: ${err.message}`);
    process.exit(1);
  }
}

async function readInput({ stdin, har }) {
  if (har) {
    return fs.readFileSync(har, "utf-8");
  }

  if (stdin || !process.stdin.isTTY) {
    return await readAllStdin();
  }

  console.error("Error: Provide input via --stdin (pipe) or --har <file>.");
  process.exit(1);
}

function readAllStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function parseTrafficInput(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return [];

  // 1) Try JSON document first (HAR, arrays, objects).
  const doc = tryParseJson(trimmed);
  if (doc) {
    const har = parseHar(doc);
    if (har.length) return har;

    const generic = parseGenericJson(doc);
    if (generic.length) return generic;
  }

  // 2) Fallback: JSON lines
  return parseJsonLines(trimmed);
}

function parseHar(doc) {
  const entries = doc?.log?.entries;
  if (!Array.isArray(entries)) return [];

  const observations = [];

  for (const entry of entries) {
    const method = entry?.request?.method;
    const url = entry?.request?.url;

    const content = entry?.response?.content;
    const text = content?.text;
    if (!method || !url || !text) continue;

    const decoded = decodePossiblyBase64(text, content?.encoding);
    const body = tryParseJson(decoded);
    if (body === null) continue;

    observations.push({ method, url, body });
  }

  return observations;
}

function parseGenericJson(doc) {
  // Accept a few common shapes used by tracing systems:
  // - [{ method, url, body }]
  // - [{ request:{method,url}, response:{body|data} }]
  // - { entries: [...] }
  const items = Array.isArray(doc)
    ? doc
    : Array.isArray(doc?.entries)
      ? doc.entries
      : [];

  const observations = [];

  for (const item of items) {
    const method = item?.method || item?.request?.method;
    const url = item?.url || item?.request?.url;

    const bodyCandidate =
      item?.body ?? item?.response?.body ?? item?.response?.data ?? item?.data;

    const body =
      typeof bodyCandidate === "string"
        ? tryParseJson(bodyCandidate)
        : bodyCandidate;

    if (!method || !url || body === null || body === undefined) continue;
    if (typeof body !== "object") continue; // only keep JSON objects/arrays

    observations.push({ method, url, body });
  }

  return observations;
}

function parseJsonLines(text) {
  const observations = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const obj = tryParseJson(line);
    if (!obj) continue;

    const method = obj?.method || obj?.request?.method;
    const url = obj?.url || obj?.request?.url;

    const bodyCandidate =
      obj?.body ?? obj?.response?.body ?? obj?.response?.data ?? obj?.data;

    const body =
      typeof bodyCandidate === "string"
        ? tryParseJson(bodyCandidate)
        : bodyCandidate;

    if (!method || !url || body === null || body === undefined) continue;
    if (typeof body !== "object") continue;

    observations.push({ method, url, body });
  }

  return observations;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function decodePossiblyBase64(text, encoding) {
  if (String(encoding || "").toLowerCase() !== "base64") return text;
  try {
    return Buffer.from(String(text), "base64").toString("utf8");
  } catch {
    return text;
  }
}

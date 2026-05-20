import axios from "axios";
import { maskSensitiveData } from "./masker.js";

const RETRY_DEFAULTS = {
  retries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
};

const DEFAULT_TIMEOUT_MS = 10000;

let didWarnEmptyAuth = false;

function isRetryable(err) {
  if (!err) return false;
  if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") return true;
  if (err.response && err.response.status >= 500 && err.response.status < 600)
    return true;
  if (!err.response) return true;
  return false;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function getRequestTimeoutMs(env = process.env) {
  const configured = Number(env.APIDRIFT_TIMEOUT_MS);
  if (!Number.isSafeInteger(configured) || configured <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }
  return configured;
}

async function fetchWithRetry(
  url,
  options,
  attempt = 1,
  config = RETRY_DEFAULTS,
) {
  try {
    return await axios({ ...options, url, timeout: getRequestTimeoutMs() });
  } catch (err) {
    if (attempt < config.retries && isRetryable(err)) {
      const delay = Math.min(
        config.baseDelay * 2 ** (attempt - 1),
        config.maxDelay,
      );
      await sleep(delay);
      return fetchWithRetry(url, options, attempt + 1, config);
    }
    throw err;
  }
}

export async function fetchEndpoint(baseUrl, endpoint, headers = {}) {
  warnIfEmptyOrUnresolvedAuth(headers);
  const url = `${baseUrl}${endpoint.path}`;

  const response = await fetchWithRetry(url, {
    method: endpoint.method,
    headers,
    data: endpoint.body || undefined,
  });

  const maskedData = maskSensitiveData(response.data);

  return {
    status: response.status,
    data: maskedData,
    endpoint: endpoint.path,
    method: endpoint.method,
  };
}

function warnIfEmptyOrUnresolvedAuth(headers) {
  if (didWarnEmptyAuth) return;
  if (!headers || typeof headers !== "object") return;

  const authKey = Object.keys(headers).find(
    (k) => String(k).toLowerCase() === "authorization",
  );
  if (!authKey) return;

  const rawValue = headers[authKey];
  const value =
    rawValue === undefined || rawValue === null ? "" : String(rawValue);
  const trimmed = value.trim();

  const looksEmptyBearer = /^bearer\s*$/i.test(trimmed);
  const looksUnresolved = /\$\{[^}]+\}/.test(value);

  if (!trimmed || looksEmptyBearer || looksUnresolved) {
    didWarnEmptyAuth = true;
    console.warn(
      "Warning: Authorization header looks empty/unresolved. If this API needs auth, ensure your .env provides STAGING_TOKEN/PROD_TOKEN (or set env vars) before running apidrift.",
    );
  }
}

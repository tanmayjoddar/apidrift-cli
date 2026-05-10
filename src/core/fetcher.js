import axios from "axios";
import { maskSensitiveData } from "./masker.js";

const RETRY_DEFAULTS = {
  retries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
};

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

async function fetchWithRetry(url, options, attempt = 1, config = RETRY_DEFAULTS) {
  try {
    return await axios({ ...options, url, timeout: 10000 });
  } catch (err) {
    if (attempt < config.retries && isRetryable(err)) {
      const delay = Math.min(config.baseDelay * 2 ** (attempt - 1), config.maxDelay);
      await sleep(delay);
      return fetchWithRetry(url, options, attempt + 1, config);
    }
    throw err;
  }
}

export async function fetchEndpoint(baseUrl, endpoint, headers = {}) {
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

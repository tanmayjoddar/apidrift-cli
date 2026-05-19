const DEFAULT_HTTP_TIMEOUT_MS = 10000;

export function getHttpTimeoutMs(env = process.env) {
  const rawTimeout = env.APIDRIFT_HTTP_TIMEOUT_MS;

  if (rawTimeout === undefined || rawTimeout === "") {
    return DEFAULT_HTTP_TIMEOUT_MS;
  }

  const timeout = Number(rawTimeout);
  if (!Number.isInteger(timeout) || timeout <= 0) {
    throw new Error(
      "APIDRIFT_HTTP_TIMEOUT_MS must be a positive integer number of milliseconds",
    );
  }

  return timeout;
}

import axios from "axios";
import { getHttpTimeoutMs } from "../utils/httpTimeout.js";

export async function discoverOpenAPI(
  specUrl,
  headers = {},
  methods = ["GET"],
) {
  const resp = await axios({
    method: "GET",
    url: specUrl,
    headers,
    timeout: getHttpTimeoutMs(),
  });
  const spec = resp.data;

  const allowed = new Set(
    (Array.isArray(methods) ? methods : [methods])
      .flatMap((m) => String(m || "").split(","))
      .map((m) => m.trim().toUpperCase())
      .filter(Boolean),
  );
  if (allowed.size === 0) allowed.add("GET");

  const endpoints = [];
  const paths = spec.paths || {};

  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of Object.keys(pathItem || {})) {
      const methodUpper = method.toUpperCase();
      if (
        ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(methodUpper) &&
        allowed.has(methodUpper)
      ) {
        endpoints.push({ method: methodUpper, path });
      }
    }
  }

  return endpoints;
}

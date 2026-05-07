import { discoverOpenAPI } from "./openapi.js";
import { discoverGraphQL } from "./graphql.js";
import { discoverHeuristic } from "./heuristic.js";

export async function discoverEndpoints({
  discovery,
  openapiUrl,
  baseUrl,
  headers = {},
  methods = ["GET"],
}) {
  const allowedMethods = normalizeMethods(methods);

  if (discovery === "openapi" && openapiUrl) {
    return await discoverOpenAPI(openapiUrl, headers, allowedMethods);
  }

  const allowGraphQL = allowedMethods.includes("POST");
  if (
    allowGraphQL &&
    (discovery === "graphql" || (discovery === "auto" && isGraphQLUrl(baseUrl)))
  ) {
    try {
      return await discoverGraphQL(baseUrl, headers);
    } catch {
      // fallthrough to heuristic
    }
  }

  return await discoverHeuristic(baseUrl, headers, allowedMethods);
}

function isGraphQLUrl(url) {
  return /\/graphql/.test(url);
}

function normalizeMethods(methods) {
  const input = Array.isArray(methods) ? methods : [methods];
  const normalized = input
    .flatMap((m) => String(m || "").split(","))
    .map((m) => m.trim().toUpperCase())
    .filter(Boolean);
  return normalized.length ? Array.from(new Set(normalized)) : ["GET"];
}

const SAFE_PATHS = [
  "/health",
  "/status",
  "/version",
  "/api/health",
  "/actuator/health",
  "/users",
  "/posts",
  "/products",
];

export function safeHeuristic(baseUrl, methods = ["GET"]) {
  if (!methods.includes("GET")) {
    console.warn(
      "Heuristic discovery only supports GET for safety. No endpoints will be discovered.",
    );
    return [];
  }
  return SAFE_PATHS.map((path) => ({ method: "GET", path }));
}

export async function discoverHeuristic(
  baseUrl,
  headers = {},
  methods = ["GET"],
) {
  void baseUrl;
  void headers;
  return safeHeuristic(baseUrl, methods);
}

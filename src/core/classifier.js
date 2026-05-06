export function classifyChanges(changes) {
  return changes.map((change) => ({
    ...change,
    severity: getSeverity(change.type),
  }));
}

function getSeverity(type) {
  if (type === "removed" || type === "type_changed") return "breaking";
  if (type === "added") return "additive";
  return "clean";
}

export function summarize(classified) {
  return {
    breaking: classified.filter((c) => c.severity === "breaking").length,
    additive: classified.filter((c) => c.severity === "additive").length,
    total: classified.length,
    hasBreakingChanges: classified.some((c) => c.severity === "breaking"),
  };
}

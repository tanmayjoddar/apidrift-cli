export function diffSchemas(schemaA, schemaB, path = "") {
  const changes = [];

  const allKeys = new Set([
    ...Object.keys(schemaA || {}),
    ...Object.keys(schemaB || {}),
  ]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const valA = schemaA?.[key];
    const valB = schemaB?.[key];

    if (valA === undefined) {
      changes.push({ path: currentPath, type: "added", from: null, to: valB });
      continue;
    }
    if (valB === undefined) {
      changes.push({
        path: currentPath,
        type: "removed",
        from: valA,
        to: null,
      });
      continue;
    }

    const bothObjects =
      typeof valA === "object" &&
      !Array.isArray(valA) &&
      typeof valB === "object" &&
      !Array.isArray(valB);

    if (bothObjects) {
      changes.push(...diffSchemas(valA, valB, currentPath));
    } else if (JSON.stringify(valA) !== JSON.stringify(valB)) {
      changes.push({
        path: currentPath,
        type: "type_changed",
        from: valA,
        to: valB,
      });
    }
  }

  return changes;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeSchema(a, b) {
  if (a === undefined) return b;
  if (b === undefined) return a;

  if (typeof a === "string" && typeof b === "string") {
    return a === b ? a : "mixed";
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length === 0) return b;
    if (b.length === 0) return a;
    return [mergeSchema(a[0], b[0])];
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const out = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      out[key] = mergeSchema(a[key], b[key]);
    }
    return out;
  }

  return "mixed";
}

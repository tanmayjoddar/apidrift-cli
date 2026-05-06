// Input:  { userId: 123, name: "John", tags: ["admin"] }
// Output: { userId: "number", name: "string", tags: ["string"] }

export function inferSchema(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    return [inferSchema(value[0])];
  }
  if (typeof value === "object") {
    const shape = {};
    for (const key in value) {
      shape[key] = inferSchema(value[key]);
    }
    return shape;
  }
  return typeof value;
}

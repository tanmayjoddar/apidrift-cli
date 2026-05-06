import { diffSchemas } from "../../src/core/differ.js";

describe("diffSchemas", () => {
  test("should detect added fields", () => {
    const schemaA = { a: "string" };
    const schemaB = { a: "string", b: "number" };
    const changes = diffSchemas(schemaA, schemaB);
    expect(changes).toEqual([
      { path: "b", type: "added", from: null, to: "number" },
    ]);
  });

  test("should detect removed fields", () => {
    const schemaA = { a: "string", b: "number" };
    const schemaB = { a: "string" };
    const changes = diffSchemas(schemaA, schemaB);
    expect(changes).toEqual([
      { path: "b", type: "removed", from: "number", to: null },
    ]);
  });

  test("should detect type changes", () => {
    const schemaA = { a: "string" };
    const schemaB = { a: "number" };
    const changes = diffSchemas(schemaA, schemaB);
    expect(changes).toEqual([
      { path: "a", type: "type_changed", from: "string", to: "number" },
    ]);
  });

  test("should handle nested objects", () => {
    const schemaA = { a: { b: "string" } };
    const schemaB = { a: { b: "number" } };
    const changes = diffSchemas(schemaA, schemaB);
    expect(changes).toEqual([
      { path: "a.b", type: "type_changed", from: "string", to: "number" },
    ]);
  });
});

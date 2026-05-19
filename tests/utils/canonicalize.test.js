import {
  canonicalEndpoint,
  canonicalizePathname,
  normalizeUrl,
} from "../../src/utils/canonicalize.js";

describe("canonicalizePathname", () => {
  test("keeps the root path unchanged", () => {
    expect(canonicalizePathname("/")).toBe("/");
  });

  test("replaces numeric path segments with :id", () => {
    expect(canonicalizePathname("/users/123/orders/456")).toBe(
      "/users/:id/orders/:id",
    );
  });

  test("replaces UUID path segments with :uuid", () => {
    expect(
      canonicalizePathname("/users/550e8400-e29b-41d4-a716-446655440000"),
    ).toBe("/users/:uuid");
  });

  test("replaces high-entropy path segments with :id", () => {
    expect(canonicalizePathname("/sessions/abc123def456")).toBe(
      "/sessions/:id",
    );
  });
});

describe("canonicalEndpoint", () => {
  test("normalizes method casing and URL pathname", () => {
    expect(canonicalEndpoint("post", "https://api.example.com/users/123")).toBe(
      "POST /users/:id",
    );
  });
});

describe("normalizeUrl", () => {
  test("removes query and hash while canonicalizing the pathname", () => {
    expect(
      normalizeUrl("https://api.example.com/users/123?token=secret#section"),
    ).toBe("https://api.example.com/users/:id");
  });
});

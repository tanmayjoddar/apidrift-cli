import {
  canonicalizePathname,
  normalizeUrl,
} from "../../src/utils/canonicalize.js";

describe("canonicalizePathname", () => {
  test("replaces numeric path segments with :id", () => {
    expect(canonicalizePathname("/users/123/posts/456")).toBe(
      "/users/:id/posts/:id",
    );
  });

  test("replaces UUID path segments with :uuid", () => {
    expect(
      canonicalizePathname(
        "/teams/550e8400-e29b-41d4-a716-446655440000/members",
      ),
    ).toBe("/teams/:uuid/members");
  });

  test("replaces high-entropy path segments with :id", () => {
    expect(canonicalizePathname("/objects/a1b2c3d4e5f6")).toBe(
      "/objects/:id",
    );
  });

  test("keeps the root path as /", () => {
    expect(canonicalizePathname("/")).toBe("/");
  });
});

describe("normalizeUrl", () => {
  test("removes query and hash while canonicalizing the pathname", () => {
    expect(
      normalizeUrl("https://api.example.com/users/123?include=posts#details"),
    ).toBe("https://api.example.com/users/:id");
  });
});

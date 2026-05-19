import { sanitizeTag } from "../../src/storage/sanitizeTag.js";

describe("sanitizeTag", () => {
  it("passes through safe tags unchanged", () => {
    expect(sanitizeTag("v1.0")).toBe("v1.0");
    expect(sanitizeTag("v1.0.13")).toBe("v1.0.13");
    expect(sanitizeTag("prod-users")).toBe("prod-users");
    expect(sanitizeTag("my_snapshot")).toBe("my_snapshot");
    expect(sanitizeTag("abc123")).toBe("abc123");
  });

  it("replaces colons with underscores", () => {
    expect(sanitizeTag("v1:0:0")).toBe("v1_0_0");
    expect(sanitizeTag("2026-05-19T12:00:00")).toBe("2026-05-19T12_00_00");
  });

  it("prevents path traversal via ../", () => {
    expect(sanitizeTag("../etc/passwd")).toBe("etc_passwd");
    expect(sanitizeTag("..\\windows\\system32")).toBe("windows_system32");
    expect(sanitizeTag("foo/../../bar")).toBe("foo_bar");
  });

  it("blocks path separators", () => {
    expect(sanitizeTag("foo/bar")).toBe("foo_bar");
    expect(sanitizeTag("foo\\bar")).toBe("foo_bar");
  });

  it("handles Windows-invalid characters", () => {
    expect(sanitizeTag("con:nul")).toBe("con_nul");
    expect(sanitizeTag("file?.json")).toBe("file_.json");
    expect(sanitizeTag("star*test")).toBe("star_test");
    expect(sanitizeTag('quote"test')).toBe("quote_test");
    expect(sanitizeTag("less<than")).toBe("less_than");
    expect(sanitizeTag("greater>than")).toBe("greater_than");
    expect(sanitizeTag("pipe|test")).toBe("pipe_test");
  });

  it("handles empty and invalid input", () => {
    expect(sanitizeTag("")).toBe("untitled");
    expect(sanitizeTag(null)).toBe("untitled");
    expect(sanitizeTag(undefined)).toBe("untitled");
    expect(sanitizeTag(123)).toBe("untitled");
  });

  it("handles tags that are entirely unsafe characters", () => {
    expect(sanitizeTag("../../")).toBe("untitled");
    expect(sanitizeTag("...")).toBe("untitled");
    expect(sanitizeTag("///")).toBe("untitled");
    expect(sanitizeTag("   ")).toBe("untitled");
  });

  it("collapses consecutive unsafe replacements", () => {
    expect(sanitizeTag("foo   bar")).toBe("foo_bar");
    expect(sanitizeTag("a//b//c")).toBe("a_b_c");
    expect(sanitizeTag("x:y:z")).toBe("x_y_z");
  });

  it("strips leading and trailing underscores from sanitization", () => {
    expect(sanitizeTag("/foo")).toBe("foo");
    expect(sanitizeTag("foo/")).toBe("foo");
    expect(sanitizeTag(":v1.0:")).toBe("v1.0");
  });

  it("preserves dots, underscores, and hyphens in the middle", () => {
    expect(sanitizeTag("my-app_v2.1.0-beta")).toBe("my-app_v2.1.0-beta");
    expect(sanitizeTag("a.b_c-d")).toBe("a.b_c-d");
  });
});

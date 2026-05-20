import { getRequestTimeoutMs } from "../../src/core/fetcher.js";

describe("getRequestTimeoutMs", () => {
  test("uses the default timeout when APIDRIFT_TIMEOUT_MS is unset", () => {
    expect(getRequestTimeoutMs({})).toBe(10000);
  });

  test("uses a positive integer timeout from APIDRIFT_TIMEOUT_MS", () => {
    expect(getRequestTimeoutMs({ APIDRIFT_TIMEOUT_MS: "25000" })).toBe(25000);
  });

  test.each(["0", "-1", "abc", "10.5", "Infinity"])(
    "falls back to the default timeout for invalid value %s",
    (value) => {
      expect(getRequestTimeoutMs({ APIDRIFT_TIMEOUT_MS: value })).toBe(10000);
    },
  );
});

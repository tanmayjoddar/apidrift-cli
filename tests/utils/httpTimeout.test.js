import { getHttpTimeoutMs } from "../../src/utils/httpTimeout.js";

describe("getHttpTimeoutMs", () => {
  test("uses the default timeout when env var is unset", () => {
    expect(getHttpTimeoutMs({})).toBe(10000);
  });

  test("reads a positive integer timeout from the environment", () => {
    expect(getHttpTimeoutMs({ APIDRIFT_HTTP_TIMEOUT_MS: "2500" })).toBe(2500);
  });

  test.each(["0", "-1", "1.5", "abc"])(
    "rejects invalid timeout value %s",
    (value) => {
      expect(() =>
        getHttpTimeoutMs({ APIDRIFT_HTTP_TIMEOUT_MS: value }),
      ).toThrow("APIDRIFT_HTTP_TIMEOUT_MS must be a positive integer");
    },
  );
});

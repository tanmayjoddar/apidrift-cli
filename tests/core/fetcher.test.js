import { jest } from "@jest/globals";

const axiosMock = jest.fn();

jest.unstable_mockModule("axios", () => ({
  default: axiosMock,
}));

const { fetchEndpoint, getRequestTimeoutMs } = await import(
  "../../src/core/fetcher.js"
);

describe("fetchEndpoint timeout", () => {
  const previousTimeout = process.env.APIDRIFT_TIMEOUT_MS;

  beforeEach(() => {
    axiosMock.mockReset();
    delete process.env.APIDRIFT_TIMEOUT_MS;
  });

  afterAll(() => {
    if (previousTimeout === undefined) {
      delete process.env.APIDRIFT_TIMEOUT_MS;
    } else {
      process.env.APIDRIFT_TIMEOUT_MS = previousTimeout;
    }
  });

  test("uses the default timeout when APIDRIFT_TIMEOUT_MS is unset", () => {
    expect(getRequestTimeoutMs()).toBe(10000);
  });

  test("uses APIDRIFT_TIMEOUT_MS when it is a positive number", async () => {
    process.env.APIDRIFT_TIMEOUT_MS = "25000";
    axiosMock.mockResolvedValue({ status: 200, data: { ok: true } });

    await fetchEndpoint("https://api.example.com", {
      path: "/users",
      method: "GET",
    });

    expect(axiosMock).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 25000,
        url: "https://api.example.com/users",
      }),
    );
  });

  test("falls back to the default timeout when APIDRIFT_TIMEOUT_MS is invalid", () => {
    process.env.APIDRIFT_TIMEOUT_MS = "not-a-number";

    expect(getRequestTimeoutMs()).toBe(10000);
  });
});

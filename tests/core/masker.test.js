import { maskSensitiveData } from "../../src/core/masker.js";

describe("maskSensitiveData", () => {
  test("redacts sensitive keys at nested object levels", () => {
    const payload = {
      user: {
        name: "Saurabh",
        password: "plain-text",
        profile: {
          apiKey: "api-key-value",
          access_key: "access-key-value",
        },
      },
      authorization: "Bearer token",
    };

    expect(maskSensitiveData(payload)).toEqual({
      user: {
        name: "Saurabh",
        password: "[REDACTED]",
        profile: {
          apiKey: "[REDACTED]",
          access_key: "[REDACTED]",
        },
      },
      authorization: "[REDACTED]",
    });
  });

  test("redacts sensitive values inside arrays", () => {
    const payload = {
      events: [
        {
          id: 1,
          jwt: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature",
        },
        {
          id: 2,
          note: "card 4111 1111 1111 1111 should be hidden",
        },
      ],
    };

    expect(maskSensitiveData(payload)).toEqual({
      events: [
        {
          id: 1,
          jwt: "[REDACTED]",
        },
        {
          id: 2,
          note: "[REDACTED]",
        },
      ],
    });
  });

  test("leaves non-sensitive values unchanged", () => {
    const payload = {
      status: "ok",
      count: 2,
      flags: [true, false],
      metadata: null,
    };

    expect(maskSensitiveData(payload)).toEqual(payload);
  });
});

import { maskSensitiveData } from "../../src/core/masker.js";

describe("maskSensitiveData", () => {
  test.each([
    "token",
    "password",
    "secret",
    "authorization",
    "api_key",
  ])("redacts sensitive key %s", (key) => {
    expect(maskSensitiveData({ [key]: "should-not-leak" })).toEqual({
      [key]: "[REDACTED]",
    });
  });

  test("redacts JWT-like and credit-card-like string values", () => {
    const data = {
      session:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature",
      card: "4111-1111-1111-1111",
      message: "public response body",
    };

    expect(maskSensitiveData(data)).toEqual({
      session: "[REDACTED]",
      card: "[REDACTED]",
      message: "public response body",
    });
  });

  test("redacts nested objects and arrays", () => {
    const data = {
      user: {
        profile: {
          password: "nested-password",
        },
      },
      requests: [
        {
          headers: {
            authorization: "Bearer abc123",
          },
        },
        {
          response: {
            body: "safe",
            cardNumber: "4111111111111111",
          },
        },
      ],
    };

    expect(maskSensitiveData(data)).toEqual({
      user: {
        profile: {
          password: "[REDACTED]",
        },
      },
      requests: [
        {
          headers: {
            authorization: "[REDACTED]",
          },
        },
        {
          response: {
            body: "safe",
            cardNumber: "[REDACTED]",
          },
        },
      ],
    });
  });

  test("mutates object inputs to match current masking behavior", () => {
    const data = {
      token: "plain-token",
      nested: {
        secret: "nested-secret",
      },
    };

    const masked = maskSensitiveData(data);

    expect(masked).toBe(data);
    expect(data).toEqual({
      token: "[REDACTED]",
      nested: {
        secret: "[REDACTED]",
      },
    });
  });
});

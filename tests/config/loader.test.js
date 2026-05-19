import fs from "fs";
import os from "os";
import path from "path";

import { loadConfig } from "../../src/config/loader.js";

describe("loadConfig", () => {
  let originalCwd;
  let tempDir;
  let originalEnv;

  beforeEach(() => {
    originalCwd = process.cwd();
    originalEnv = { ...process.env };
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "apidrift-config-"));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("returns the default config when apidrift.config.json is missing", () => {
    expect(loadConfig()).toEqual({
      environments: {},
      endpoints: [],
      discovery: "heuristic",
    });
  });

  test("interpolates environment variables in config values", () => {
    process.env.API_BASE_URL = "https://api.example.com";
    process.env.AUTH_TOKEN = "secret-token";

    fs.writeFileSync(
      "apidrift.config.json",
      JSON.stringify({
        environments: {
          production: {
            baseUrl: "${API_BASE_URL}",
            headers: {
              Authorization: "Bearer ${AUTH_TOKEN}",
            },
          },
        },
        endpoints: ["/users"],
        discovery: "openapi",
      }),
    );

    expect(loadConfig()).toEqual({
      environments: {
        production: {
          baseUrl: "https://api.example.com",
          headers: {
            Authorization: "Bearer secret-token",
          },
        },
      },
      endpoints: ["/users"],
      discovery: "openapi",
    });
  });

  test("replaces missing environment variables with empty strings", () => {
    fs.writeFileSync(
      "apidrift.config.json",
      JSON.stringify({
        environments: {
          local: {
            baseUrl: "${MISSING_API_URL}",
          },
        },
        endpoints: [],
      }),
    );

    expect(loadConfig().environments.local.baseUrl).toBe("");
  });
});

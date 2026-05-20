import fs from "fs";
import os from "os";
import path from "path";
import { loadConfig } from "../../src/config/loader.js";

describe("loadConfig", () => {
  let originalCwd;
  let tempDir;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "apidrift-loader-"));
    process.chdir(tempDir);
    delete process.env.STAGING_TOKEN;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
    delete process.env.STAGING_TOKEN;
  });

  test("returns default config when apidrift.config.json is missing", () => {
    expect(loadConfig()).toEqual({
      environments: {},
      endpoints: [],
      discovery: "heuristic",
    });
  });

  test("interpolates environment variables from config placeholders", () => {
    process.env.STAGING_TOKEN = "staging-secret-token";

    fs.writeFileSync(
      "apidrift.config.json",
      JSON.stringify({
        environments: {
          staging: {
            baseUrl: "https://staging.example.com",
            headers: {
              authorization: "Bearer ${STAGING_TOKEN}",
            },
          },
        },
        endpoints: ["/users"],
        discovery: "openapi",
      }),
    );

    expect(loadConfig()).toEqual({
      environments: {
        staging: {
          baseUrl: "https://staging.example.com",
          headers: {
            authorization: "Bearer staging-secret-token",
          },
        },
      },
      endpoints: ["/users"],
      discovery: "openapi",
    });
  });

  test("replaces missing environment variables with an empty string", () => {
    fs.writeFileSync(
      "apidrift.config.json",
      JSON.stringify({
        environments: {
          staging: {
            headers: {
              authorization: "Bearer ${STAGING_TOKEN}",
            },
          },
        },
        endpoints: [],
        discovery: "heuristic",
      }),
    );

    expect(loadConfig()).toEqual({
      environments: {
        staging: {
          headers: {
            authorization: "Bearer ",
          },
        },
      },
      endpoints: [],
      discovery: "heuristic",
    });
  });
});

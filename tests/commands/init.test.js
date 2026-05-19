import fs from "fs";
import os from "os";
import path from "path";

const promptsMock = jest.fn();

jest.unstable_mockModule("prompts", () => ({
  default: promptsMock,
}));

describe("runInit", () => {
  let originalCwd;
  let tempDir;
  let logs;

  beforeEach(() => {
    jest.resetModules();
    promptsMock.mockReset();
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "apidrift-init-"));
    process.chdir(tempDir);
    logs = [];
    jest.spyOn(console, "log").mockImplementation((message = "") => {
      logs.push(String(message));
    });
  });

  afterEach(() => {
    console.log.mockRestore();
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("prints next steps without overwriting existing config when declined", async () => {
    const configPath = path.join(tempDir, "apidrift.config.json");
    const originalConfig = '{ "keep": true }\n';
    fs.writeFileSync(configPath, originalConfig);
    promptsMock.mockResolvedValueOnce({ overwrite: false });

    const { runInit } = await import("../../src/commands/init.js");
    await runInit();

    expect(fs.readFileSync(configPath, "utf-8")).toBe(originalConfig);
    expect(logs.join("\n")).toContain("Keeping existing apidrift.config.json");
    expect(logs.join("\n")).toContain("STAGING_TOKEN=your_token_here");
    expect(logs.join("\n")).toContain("apidrift snapshot --tag v1.0 --env staging");
  });
});

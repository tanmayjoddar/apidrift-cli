import fs from "fs";
import os from "os";
import path from "path";

describe("snapshotStore", () => {
  let originalHome;
  let tempHome;

  beforeEach(() => {
    originalHome = process.env.HOME;
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "apidrift-home-"));
    process.env.HOME = tempHome;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tempHome, { recursive: true, force: true });
    jest.resetModules();
  });

  test("preserves already safe snapshot tags", async () => {
    const { sanitizeSnapshotTag } = await import("../../src/storage/snapshotStore.js");

    expect(sanitizeSnapshotTag("v1.0.13")).toBe("v1.0.13");
  });

  test("sanitizes snapshot tags for safe filenames", async () => {
    const { sanitizeSnapshotTag } = await import("../../src/storage/snapshotStore.js");

    expect(sanitizeSnapshotTag("../prod:v1/users")).toBe("prod_v1_users");
  });

  test("writes unsafe tags inside the snapshot directory", async () => {
    const { saveSnapshot } = await import("../../src/storage/snapshotStore.js");
    const file = saveSnapshot("../prod:v1/users", { ok: true });
    const snapshotDir = path.join(tempHome, ".apidrift", "snapshots");

    expect(file).toBe(path.join(snapshotDir, "prod_v1_users.json"));
    expect(fs.existsSync(file)).toBe(true);
    expect(path.relative(snapshotDir, file).startsWith("..")).toBe(false);
  });
});

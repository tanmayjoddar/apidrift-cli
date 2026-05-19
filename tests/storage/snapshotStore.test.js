import fs from "fs";
import os from "os";
import path from "path";

describe("listSnapshots", () => {
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

  test("returns snapshot tags alphabetically", async () => {
    const snapshotDir = path.join(tempHome, ".apidrift", "snapshots");
    fs.mkdirSync(snapshotDir, { recursive: true });
    fs.writeFileSync(path.join(snapshotDir, "zeta.json"), "{}");
    fs.writeFileSync(path.join(snapshotDir, "alpha.json"), "{}");
    fs.writeFileSync(path.join(snapshotDir, "beta.json"), "{}");
    fs.writeFileSync(path.join(snapshotDir, "notes.txt"), "ignore me");

    const { listSnapshots } = await import("../../src/storage/snapshotStore.js");

    expect(listSnapshots()).toEqual(["alpha", "beta", "zeta"]);
  });
});

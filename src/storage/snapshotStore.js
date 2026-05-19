import fs from "fs";
import path from "path";
import os from "os";
import { sanitizeTag } from "./sanitizeTag.js";

// Stores globally in ~/.apidrift/snapshots/
const SNAP_DIR = path.join(os.homedir(), ".apidrift", "snapshots");

if (!fs.existsSync(SNAP_DIR)) fs.mkdirSync(SNAP_DIR, { recursive: true });

export function saveSnapshot(tag, data) {
  const safeTag = sanitizeTag(tag);
  const file = path.join(SNAP_DIR, `${safeTag}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

export function loadSnapshot(tag) {
  const safeTag = sanitizeTag(tag);
  const file = path.join(SNAP_DIR, `${safeTag}.json`);
  if (!fs.existsSync(file)) {
    console.error(`Snapshot "${tag}" not found. Run: apidrift list`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function listSnapshots() {
  return fs
    .readdirSync(SNAP_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

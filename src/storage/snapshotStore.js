import fs from "fs";
import path from "path";
import os from "os";

// Stores globally in ~/.apidrift/snapshots/
const SNAP_DIR = path.join(os.homedir(), ".apidrift", "snapshots");

if (!fs.existsSync(SNAP_DIR)) fs.mkdirSync(SNAP_DIR, { recursive: true });

/**
 * Sanitize a snapshot tag so it is safe to use as a filename on all platforms.
 *
 * Rules:
 *  - Only A-Z, a-z, 0-9, `.`, `_`, and `-` are allowed.
 *  - Every other character (including `:`, `/`, `\`, and space) is replaced with `_`.
 *  - Leading/trailing dots and underscores are stripped to prevent hidden-file
 *    names and confusing output.
 *  - The empty string is rejected.
 *
 * Tags that are already safe (e.g. `v1.0.13`, `prod-users`) pass through unchanged.
 *
 * @param {string} tag - Raw tag supplied by the user.
 * @returns {string} Sanitized tag string.
 * @throws {Error} If the resulting sanitized name is empty.
 */
export function sanitizeTag(tag) {
  // Replace every character that is NOT in the safe set with '_'
  let sanitized = String(tag)
    .replace(/[^A-Za-z0-9._-]/g, "_")
    // Collapse consecutive underscores for readability (optional, keeps names clean)
    .replace(/_+/g, "_")
    // Remove leading/trailing underscores and dots
    .replace(/^[._]+|[._]+$/g, "");

  if (!sanitized) {
    throw new Error(
      `Invalid snapshot tag "${tag}": tag must contain at least one alphanumeric character.`
    );
  }

  // Windows reserved device names check: CON, PRN, AUX, NUL, COM1-9, LPT1-9
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }

  return sanitized;
}

export function saveSnapshot(tag, data) {
  const safe = sanitizeTag(tag);
  const file = path.join(SNAP_DIR, `${safe}.json`);
  if (fs.existsSync(file)) {
    try {
      const existing = JSON.parse(fs.readFileSync(file, "utf-8"));
      if (existing && existing.tag !== tag) {
        throw new Error(
          `Snapshot file collision: The file for tag "${tag}" already exists and contains a different tag "${existing.tag}".`
        );
      }
    } catch (err) {
      if (err.message.includes("Snapshot file collision")) {
        throw err;
      }
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

export function loadSnapshot(tag) {
  const safe = sanitizeTag(tag);
  const file = path.join(SNAP_DIR, `${safe}.json`);
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
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

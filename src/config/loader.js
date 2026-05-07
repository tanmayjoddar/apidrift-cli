import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export function loadConfig() {
  const configPath = path.resolve(process.cwd(), "apidrift.config.json");

  if (!fs.existsSync(configPath)) {
    return {
      environments: {},
      endpoints: [],
      discovery: "heuristic",
    };
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const interpolated = raw.replace(
    /\$\{(\w+)\}/g,
    (_, key) => process.env[key] || "",
  );
  return JSON.parse(interpolated);
}

import fs from "fs";
import path from "path";
import chalk from "chalk";

const STARTER = {
  environments: {
    staging: {
      baseUrl: "https://staging.yourapi.com",
      headers: { Authorization: "Bearer ${STAGING_TOKEN}" },
    },
    prod: {
      baseUrl: "https://api.yourapi.com",
      headers: { Authorization: "Bearer ${PROD_TOKEN}" },
    },
  },
  endpoints: [
    { method: "GET", path: "/api/users/1" },
    { method: "GET", path: "/api/orders" },
  ],
};

export function runInit() {
  const dest = path.resolve(process.cwd(), "apidrift.config.json");

  if (fs.existsSync(dest)) {
    console.log(chalk.yellow("apidrift.config.json already exists"));
    return;
  }

  fs.writeFileSync(dest, JSON.stringify(STARTER, null, 2));
  console.log(chalk.green("✓ Created apidrift.config.json"));
  console.log("  Edit it to add your environments and endpoints");
  console.log("  Then run: apidrift snapshot --tag v1.0 --env staging");
}

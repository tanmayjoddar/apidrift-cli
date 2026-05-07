import fs from "fs";
import path from "path";
import chalk from "chalk";
import prompts from "prompts";

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
  endpoints: [],
};

export async function runInit() {
  const dest = path.resolve(process.cwd(), "apidrift.config.json");

  if (fs.existsSync(dest)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "apidrift.config.json already exists. Overwrite?",
      initial: false,
    });
    if (!overwrite) {
      return;
    }
  }

  const questions = [
    {
      type: "text",
      name: "stagingUrl",
      message: "What is your staging API base URL?",
    },
    {
      type: "text",
      name: "prodUrl",
      message: "What is your production API base URL?",
    },
    {
      type: "text",
      name: "openapiSpecUrl",
      message: "Optional: What is the URL of your OpenAPI/Swagger spec?",
    },
  ];

  const response = await prompts(questions);

  const config = {
    environments: {
      staging: {
        baseUrl: response.stagingUrl,
        headers: { Authorization: "Bearer ${STAGING_TOKEN}" },
      },
      prod: {
        baseUrl: response.prodUrl,
        headers: { Authorization: "Bearer ${PROD_TOKEN}" },
      },
    },
    discovery: {
      openapi: response.openapiSpecUrl || undefined,
    },
    endpoints: [],
  };

  fs.writeFileSync(dest, JSON.stringify(config, null, 2));
  console.log(chalk.green("✓ Created apidrift.config.json"));
  console.log("  You can now run snapshots against your environments.");
}

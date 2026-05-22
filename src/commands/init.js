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
      console.log(chalk.yellow("ℹ Keeping existing apidrift.config.json"));
      console.log("");
      console.log("  Your current config was not modified. Next steps:");
      console.log(
        `  1. Make sure you have a ${chalk.cyan(".env")} file or environment variables set for your tokens:`
      );
      console.log(`     ${chalk.gray("STAGING_TOKEN=your_token_here")}`);
      console.log(`     ${chalk.gray("PROD_TOKEN=your_token_here")}`);
      console.log(
        `  2. Add ${chalk.cyan(".env")} to your ${chalk.cyan(".gitignore")} to keep tokens out of Git`
      );
      console.log(
        `  3. Run: ${chalk.cyan("apidrift snapshot --tag v1.0 --env staging")}`
      );
      console.log("");
      return;
    }
  }

  const questions = [
    {
      type: "text",
      name: "stagingUrl",
      message: "What is your staging API base URL?",
      validate: (value) =>
        value.trim().startsWith("http")
          ? true
          : "Must be a valid URL starting with http",
    },
    {
      type: "text",
      name: "prodUrl",
      message: "What is your production API base URL?",
      validate: (value) =>
        value.trim().startsWith("http")
          ? true
          : "Must be a valid URL starting with http",
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
  console.log("");
  console.log("  Next steps:");
  console.log(`  1. Create a ${chalk.cyan(".env")} file in this directory:`);
  console.log(`     ${chalk.gray("STAGING_TOKEN=your_token_here")}`);
  console.log(`     ${chalk.gray("PROD_TOKEN=your_token_here")}`);
  console.log(
    `  2. Add ${chalk.cyan(".env")} to your ${chalk.cyan(".gitignore")}`,
  );
  console.log(
    `  3. Run: ${chalk.cyan("apidrift snapshot --tag v1.0 --env staging")}`,
  );
  console.log("");
}

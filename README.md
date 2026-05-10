```
                 _     _        _  __  _
  __ _ _ __ (_) __| |_ __(_)/ _|| |_
 / _` | '_ \| |/ _` | '__| | |_ | __|
| (_| | |_) | | (_| | |  | |  _|| |_
 \__,_| .__/|_|\__,_|_|  |_|_|   \__|
      |_|
```

> **Catch API schema drift before your users do.**

[![npm](https://img.shields.io/npm/v/apidrift-cli)](https://www.npmjs.com/package/apidrift-cli)
[![license](https://img.shields.io/npm/l/apidrift-cli)](./LICENSE)

---

## The Problem

Your API changed. Nobody noticed. A field was renamed. A type flipped from `string` to `number`. A key got removed. Your mobile app crashes. Your integrations break. And you find out at 3am.

```
[3:14 AM] PagerDuty: checkout is broken in prod
[3:19 AM] Root cause: userId changed string → number in last deploy
[3:21 AM] No test caught it. No alert fired. It was live for 6 hours.
```

**apidrift catches this before it reaches production.**

---

## What It Does

apidrift snapshots the _shape_ of your live API responses — not the data, just the structure — and diffs them across versions, environments, or deploys.

```bash
# One line. No config. No setup.
apidrift diff https://staging.api.com/users/1 https://prod.api.com/users/1
```

```
apidrift diff: staging → prod

✗ GET /users/:id
  ┌──────────┬────────────┬──────────┬──────────┐
  │ Field    │ Change     │ From     │ To       │
  ├──────────┼────────────┼──────────┼──────────┤
  │ userId   │ ● breaking │ "string" │ "number" │
  ├──────────┼────────────┼──────────┼──────────┤
  │ discount │ ● breaking │ "string" │(removed) │
  └──────────┴────────────┴──────────┴──────────┘

Summary: 2 breaking, 0 additive
✗ Breaking changes detected
```

---

## Install

```bash
npm install -g apidrift-cli
```

Works with any project, any API, any language. No config required to get started.

---

## Commands

### `apidrift diff` — The Star Feature

Diff two live URLs instantly. No snapshots, no config.

```bash
apidrift diff https://staging.api.com/orders https://prod.api.com/orders
```

Or diff two saved snapshots by tag:

```bash
apidrift diff v1.2 v1.3
```

Force-compare even if the endpoints differ:

```bash
apidrift diff https://api.com/users/1 https://api.com/posts/1 --force
```

---

### `apidrift init` — Set Up Your Project

```bash
cd your-project/
apidrift init
```

Walks you through setup interactively and creates `apidrift.config.json`:

```json
{
  "environments": {
    "staging": {
      "baseUrl": "https://staging.yourapi.com",
      "headers": { "Authorization": "Bearer ${STAGING_TOKEN}" }
    },
    "prod": {
      "baseUrl": "https://api.yourapi.com",
      "headers": { "Authorization": "Bearer ${PROD_TOKEN}" }
    }
  },
  "discovery": {
    "openapi": "https://api.yourapi.com/openapi.json"
  },
  "endpoints": []
}
```

After `init`, create a `.env` file (or set env vars) so `${STAGING_TOKEN}` / `${PROD_TOKEN}` resolve:

```bash
STAGING_TOKEN=your_token_here
PROD_TOKEN=your_token_here
```

- Add `.env` to `.gitignore`.
- If your `Authorization` header resolves empty (e.g. token missing), apidrift prints a warning before making requests.

---

### `apidrift snapshot` — Save A Schema

Snapshot all your configured endpoints for an environment:

```bash
apidrift snapshot --tag v1.0 --env staging
```

Or snapshot a single URL directly:

```bash
apidrift snapshot https://api.yourapi.com/users/1 --tag prod-users
```

Snapshot only specific methods:

```bash
apidrift snapshot --tag v1.0 --env staging --methods GET,POST
```

Add a delay between requests (polite to APIs):

```bash
apidrift snapshot --tag v1.0 --env staging --delay 200
```

Preview what would be snapshotted without making requests:

```bash
apidrift snapshot --tag v1.0 --env staging --dry-run
```

---

### `apidrift check` — Live Environment Comparison

Hit two environments right now and diff them on the fly:

```bash
apidrift check --envA staging --envB prod
```

Check specific methods only:

```bash
apidrift check --envA staging --envB prod --methods GET,POST
```

Add a delay between checks:

```bash
apidrift check --envA staging --envB prod --delay 300
```

With dry-run to preview which endpoints would be checked:

```bash
apidrift check --envA staging --envB prod --dry-run
```

---

### `apidrift list` — See All Snapshots

```bash
apidrift list
```

```
Saved snapshots:

  → v1.0
  → v1.1
  → prod-users
```

---

### `apidrift record` — Snapshot From Traffic

Feed real traffic into apidrift from a HAR file:

```bash
apidrift record --har traffic.har --tag nightly
```

Or pipe it from stdin:

```bash
cat traffic.json | apidrift record --stdin --tag ci-run-42
```

---

## Full Workflow Example

```bash
# 1. Set up once
apidrift init

# 2. Snapshot before deploy
apidrift snapshot --tag v1.2 --env staging

# 3. Deploy your changes

# 4. Snapshot after deploy
apidrift snapshot --tag v1.3 --env staging

# 5. See exactly what changed
apidrift diff v1.2 v1.3
```

---

## CI/CD Integration

apidrift exits with code `1` on breaking changes — a native CI gate.

```yaml
# .github/workflows/api-check.yml
name: API Contract Check

on: [push]

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g apidrift-cli
      - run: apidrift check --envA staging --envB prod
        env:
          STAGING_TOKEN: ${{ secrets.STAGING_TOKEN }}
          PROD_TOKEN: ${{ secrets.PROD_TOKEN }}
```

Breaking change detected → pipeline fails → deploy blocked. Zero extra config.

---

## How It Works

```
  Your Live API                 What apidrift stores
  ────────────────              ────────────────────
  {                             {
    userId: 123,      ──►         userId: "number",
    name: "John",                 name:   "string",
    tags: ["admin"]               tags:   ["string"]
  }                             }

        snapshot A                     snapshot B
             │                              │
             └──────────┬───────────────────┘
                        ▼
                  differ engine
                        │
             ┌──────────┴──────────┐
             │  breaking           │  additive
             │  type changed       │  new field
             │  field removed      │  (non-breaking)
             └─────────────────────┘
```

apidrift **never stores your actual data** — only the shape (field names + types). Safe to use with production APIs.

---

## Change Classification

| Change        | What It Means                             | Severity    |
| ------------- | ----------------------------------------- | ----------- |
| Field removed | A field consumers depend on is gone       | 🔴 Breaking |
| Type changed  | `string → number` silently breaks clients | 🔴 Breaking |
| Field added   | New undocumented field appeared           | 🟡 Additive |
| No change     | Schemas match exactly                     | 🟢 Clean    |

---

## Security

- Sensitive fields (`token`, `password`, `secret`, `api_key`, etc.) are **automatically redacted** before schema inference
- JWT tokens and credit card patterns in values are also redacted
- Nothing sensitive is ever written to disk

---

## Snapshot Storage

Snapshots are stored globally at `~/.apidrift/snapshots/` — accessible from any project on your machine.

---

## All Commands Reference

### `apidrift init`

Create a starter `apidrift.config.json` in current directory.

```
apidrift init [options]

Options:
  -h, --help  display help for command
```

### `apidrift snapshot`

Snapshot all endpoints for an environment or a single URL.

```
apidrift snapshot [options] [url]

Arguments:
  url                  The URL to snapshot

Options:
  --tag <tag>          Version tag e.g. v1.0
  --env <env>          Environment name e.g. staging
  --methods <methods>  Comma-separated HTTP methods to allow during
                       discovery/fetch (default: GET)
  --dry-run            Print endpoints that would be called (no requests)
  --delay <ms>         Delay in ms between endpoint requests (default: "0")
  -h, --help           display help for command
```

### `apidrift diff`

Diff two snapshots by tag or two URLs.

```
apidrift diff [options] <from> <to>

Arguments:
  from        Base snapshot tag or URL
  to          Target snapshot tag or URL

Options:
  --force     Force comparison of different endpoints
  -h, --help  display help for command
```

### `apidrift check`

Live diff two environments right now.

```
apidrift check [options]

Options:
  --envA <envA>        First environment
  --envB <envB>        Second environment
  --methods <methods>  Comma-separated HTTP methods to allow during
                       discovery/fetch (default: GET)
  --dry-run            Print endpoints that would be called (no requests)
  --delay <ms>         Delay in ms between endpoint checks (default: "0")
  -h, --help           display help for command
```

### `apidrift list`

List all saved snapshots.

```
apidrift list [options]

Options:
  -h, --help  display help for command
```

### `apidrift record`

Create a snapshot from recorded traffic (stdin or HAR).

```
apidrift record [options]

Options:
  --tag <tag>   Version tag e.g. nightly
  --stdin       Read input from stdin (supports HAR JSON or JSON lines)
  --har <file>  Read a HAR file from disk
  -h, --help    display help for command
```

## Tech Stack

| Layer         | Package                    |
| ------------- | -------------------------- |
| CLI           | commander                  |
| HTTP          | axios                      |
| Terminal UI   | chalk + cli-table3 + ora   |
| Schema engine | custom (zero dependencies) |
| Diff engine   | custom recursive differ    |

---

## License

MIT — built by [Tanmay Joddar](https://github.com/tanmayjoddar)

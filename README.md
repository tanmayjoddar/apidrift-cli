                     __        __            __   ______     __
                    |  \      |  \          |  \ /      \   |  \
  ______    ______   \$$  ____| $$  ______   \$$|  $$$$$$\ _| $$_
 |      \  /      \ |  \ /      $$ /      \ |  \| $$_  \$$|   $$ \
  \$$$$$$\|  $$$$$$\| $$|  $$$$$$$|  $$$$$$\| $$| $$ \     \$$$$$$
 /      $$| $$  | $$| $$| $$  | $$| $$   \$$| $$| $$$$      | $$ __
|  $$$$$$$| $$__/ $$| $$| $$__| $$| $$      | $$| $$        | $$|  \
 \$$    $$| $$    $$| $$ \$$    $$| $$      | $$| $$         \$$  $$
  \$$$$$$$| $$$$$$$  \$$  \$$$$$$$ \$$       \$$ \$$          \$$$$
          | $$
          | $$
           \$$
detect your schema drift before your user do !
---

## What Is This?

**apidrift** is a CLI tool you plug into **any existing project** to monitor your API responses.

It remembers the *shape* of your API responses across versions and environments — and tells you exactly what broke, what changed, and what's undocumented before it reaches production.

You bring your API. apidrift does the rest.

---

## The Problem It Solves

```
[3:14 AM] PagerDuty alert: checkout is broken in prod
[3:19 AM] Root cause: userId changed from string → number in last deploy
[3:21 AM] Nobody noticed. No test caught it. No alarm fired.
[3:22 AM] It was live for 6 hours. Users were broken.
```

This is API schema drift. It happens silently on every team.
**apidrift catches it before your users do.**

---

## Install

```bash
npm install -g apidrift
```

One global install. Works with any project, any API, any language.

---

## How To Use It (Step by Step)

### Step 1 — Go to your project

```bash
cd your-project/
```

This can be any project — Express, FastAPI, Rails, anything. apidrift just needs URLs to hit.

### Step 2 — Initialize

```bash
apidrift init
```

This creates an `apidrift.config.json` file in your project folder. Open it and fill in your own API URLs and endpoints:

```json
{
  "environments": {
    "staging": {
      "baseUrl": "https://staging.yourapi.com",
      "headers": {
        "Authorization": "Bearer ${STAGING_TOKEN}"
      }
    },
    "prod": {
      "baseUrl": "https://api.yourapi.com",
      "headers": {
        "Authorization": "Bearer ${PROD_TOKEN}"
      }
    }
  },
  "endpoints": [
    { "method": "GET",  "path": "/api/users/1" },
    { "method": "GET",  "path": "/api/orders" }
  ]
}
```

Replace the URLs and endpoints with your own. That's the only setup required.

### Step 3 — Snapshot your API today

```bash
apidrift snapshot --tag v1.0 --env staging
```

apidrift hits every endpoint you configured, reads the JSON response, and saves the shape (not the data — just the types and structure).

### Step 4 — After your next deploy, snapshot again

```bash
apidrift snapshot --tag v1.1 --env staging
```

### Step 5 — See what changed

```bash
apidrift diff v1.0 v1.1
```

Output:

```
apidrift diff: v1.0 → v1.1

✗ POST /api/orders
  ┌──────────────────┬────────────┬──────────┬───────────┐
  │ Field            │ Change     │ From     │ To        │
  ├──────────────────┼────────────┼──────────┼───────────┤
  │ discount         │ ● breaking │ "string" │ (removed) │
  ├──────────────────┼────────────┼──────────┼───────────┤
  │ userId           │ ● breaking │ "string" │ "number"  │
  └──────────────────┴────────────┴──────────┴───────────┘

✓ GET /api/users/1 — clean

Summary
  2 breaking
  0 additive
  Total changes: 2
✗ Breaking changes detected — deploy blocked
```

---

## Live Environment Comparison

No snapshots needed. Hit two environments right now and diff them:

```bash
apidrift check --envA staging --envB prod
```

If staging and prod have drifted — you'll know immediately.

---

## CI/CD Integration

apidrift exits with code `1` on breaking changes — making it a drop-in CI gate.

```yaml
# .github/workflows/api-check.yml
name: API Contract Check

on: [push]

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g apidrift
      - run: apidrift check --envA staging --envB prod
        env:
          STAGING_TOKEN: ${{ secrets.STAGING_TOKEN }}
          PROD_TOKEN: ${{ secrets.PROD_TOKEN }}
```

Breaking schema change detected → pipeline fails → deploy blocked automatically.

---

## All Commands

```
apidrift init                               Create apidrift.config.json in current folder
apidrift snapshot --tag <tag> --env <env>   Snapshot all endpoints for an environment
apidrift diff <from> <to>                   Diff two snapshots by tag
apidrift check --envA <a> --envB <b>        Live diff two environments right now
apidrift list                               List all saved snapshots
```

---

## How It Works Under The Hood

```
  Your Live API Response        What apidrift saves
  ──────────────────────        ────────────────────
  {                             {
    userId: 123,      ──►         userId: "number",
    name: "John",                 name: "string",
    tags: ["admin"]               tags: ["string"]
  }                             }
       snapshot v1                    snapshot v2
            │                              │
            └──────────┬───────────────────┘
                       ▼
              structural diff engine
                       │
            breaking / additive / clean
```

apidrift never stores your actual data — only the shape (field names + types).

---

## Change Classification

| Type | What Happened | Severity |
|---|---|---|
| Field removed | A field your consumers depend on is gone | 🔴 Breaking |
| Type changed | `string → number` silently breaks parsing | 🔴 Breaking |
| Field added | New undocumented field appeared | 🟡 Additive |
| No change | Schemas match exactly | 🟢 Clean |

---

## Auth & Tokens

Store tokens in a `.env` file in your project:

```
STAGING_TOKEN=your_token_here
PROD_TOKEN=your_token_here
```

Reference them in config as `${STAGING_TOKEN}`. apidrift reads them automatically. Never commit tokens to git.

---

## Snapshot Storage

Snapshots are stored globally at `~/.apidrift/snapshots/` — accessible from any project on your machine.

---

## Tech Stack

| Purpose | Package |
|---|---|
| CLI framework | commander |
| HTTP client | axios |
| Terminal output | chalk + cli-table3 |
| Spinner | ora |
| Schema inference + diff | custom engine (no external lib) |

---

## License

MIT

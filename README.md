```
                 _     _        _  __  _
  __ _ _ __ (_) __| |_ __(_)/ _|| |_
 / _` | '_ \| |/ _` | '__| | |_ | __|
| (_| | |_) | | (_| | |  | |  _|| |_
 \__,_| .__/|_|\__,_|_|  |_|_|   \__|
      |_|

  detect api schema drift. before your users do.
```

---

**apidrift** is a zero-config CLI that snapshots your live API response *shapes* across environments and versions — and tells you exactly what broke, what changed, and what's undocumented.

No spec files. No setup. Just point it at your API and go.

---

## The Problem

```
[3:14 AM] PagerDuty alert: checkout is broken in prod
[3:16 AM] Engineer checks logs
[3:19 AM] Root cause: userId changed from string → number in last deploy
[3:21 AM] Nobody noticed. No test caught it. No alarm fired.
[3:22 AM] It was live for 6 hours.
```

This is API schema drift. It happens silently. **apidrift catches it before it reaches your users.**

---

## Install

```bash
npm install -g apidrift
```

---

## Quickstart

```bash
# 1. Initialize config in your project
apidrift init

# 2. Snapshot your staging API
apidrift snapshot --tag v1.2 --env staging

# 3. Snapshot prod
apidrift snapshot --tag v1.3 --env prod

# 4. See what drifted
apidrift diff v1.2 v1.3
```

---

## Output

```
apidrift diff: v1.2 → v1.3

✗ POST /api/orders
  Field              Change        From      To
  discount           ● breaking    string    (removed)
  userId             ● breaking    string    number
  metadata.source    ◎ additive    —         string

✓ GET /api/users/:id — clean

Summary
  2 breaking
  1 additive
  Total changes: 3
✗ Breaking changes detected — exit code 1
```

---

## Commands

```
apidrift init                              Create apidrift.config.json
apidrift snapshot --tag <tag> --env <env>  Snapshot all endpoints for an env
apidrift diff <from> <to>                  Diff two snapshots by tag
apidrift check --envA <a> --envB <b>       Live diff two environments right now
apidrift list                              List all saved snapshots
```

---

## Configuration

```json
// apidrift.config.json
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
    { "method": "GET",  "path": "/api/orders" },
    { "method": "POST", "path": "/api/orders", "body": { "item": "test" } }
  ]
}
```

Token values are read from environment variables automatically. Store them in a `.env` file:

```
STAGING_TOKEN=your_staging_token_here
PROD_TOKEN=your_prod_token_here
```

---

## CI/CD Integration

apidrift exits with code `1` when breaking changes are detected — making it a first-class CI gate.

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

If the schemas between staging and prod have drifted, the pipeline fails. Deploy blocked.

---

## How It Works

```
  Live API Response             Stored Schema
  ──────────────────            ──────────────────
  {                             {
    userId: 123,       ──►        userId: "number",
    name: "John",                 name: "string",
    tags: ["admin"]               tags: ["string"]
  }                             }

        snapshot A                     snapshot B
             │                              │
             └──────────┬───────────────────┘
                        │
                   differ.js
                        │
             ┌──────────▼──────────┐
             │  structural diff    │
             │  + classifier       │
             └──────────┬──────────┘
                        │
              breaking / additive / clean
```

apidrift never stores your data — only the *shape* (types and structure) of your responses.

---

## Change Classification

| Type | Meaning | Severity |
|---|---|---|
| Field removed | Consumer will crash trying to read it | 🔴 Breaking |
| Type changed | `string → number` silently breaks parsing | 🔴 Breaking |
| Field added | New undocumented field — consumers may not handle | 🟡 Additive |
| No change | Schemas match exactly | 🟢 Clean |

---

## Tech Stack

Built with Node.js. Zero heavy dependencies.

| Purpose | Package |
|---|---|
| CLI framework | commander |
| HTTP client | axios |
| Terminal output | chalk + cli-table3 |
| Spinner | ora |
| Schema + diff | custom (no external lib) |

---

## Snapshot Storage

Snapshots are stored globally at `~/.apidrift/snapshots/<tag>.json` — accessible from any project directory.

---

## License

MIT

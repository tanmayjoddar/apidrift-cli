# Contributing

Thanks for taking the time to contribute to **apidrift**.

## Quick Start

Prereqs:

- Node.js (LTS recommended)
- npm

Setup:

- `npm install`
- `npm test`

Run the CLI locally:

- `node bin/apidrift.js --help`

## Project Structure

```
src/
	commands/     CLI commands
	core/         schema inference + diff engine
	discovery/    OpenAPI / GraphQL / heuristic discovery
	storage/      snapshot persistence
	ui/           terminal rendering
```

## Good First Issues

Look for issues labeled:

- good first issue
- docs
- help wanted
- gssoc

## Issue Assignment

Please comment on an issue before starting work.

Maintainers may assign issues to avoid duplicate work and conflicting pull requests.

Unassigned PRs may be closed if the issue is already being worked on.

## Manual Testing

Run against two live endpoints:

```bash
node bin/apidrift.js diff \
https://jsonplaceholder.typicode.com/users/1 \
https://jsonplaceholder.typicode.com/posts/1 \
--force
```

## What To Work On

- Bug fixes (with a minimal reproducible example)
- Docs improvements (README clarity, examples)
- Small, focused features with tests

If you’re unsure, open an issue first describing the problem and the proposed approach.

## Development Notes

- Keep changes small and scoped.
- Avoid breaking CLI UX; prefer backward-compatible options.
- Be mindful of safety defaults (GET-only by default; opt-in for non-GET methods).

## Tests

- Add/adjust tests when behavior changes.
- Ensure `npm test` passes before opening a PR.

## Commit Messages

Use clear, conventional messages (examples):

- `fix: handle empty auth token warning`
- `docs: clarify init + env setup`
- `chore: bump version`

## Pull Requests

Before opening a PR:

- Explain _why_ the change is needed.
- Include before/after CLI output when relevant.
- Note any breaking changes clearly.

## Security

If you discover a security issue, please **do not** open a public issue. Instead, contact the maintainer directly.

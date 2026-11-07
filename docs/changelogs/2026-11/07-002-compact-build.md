# Add compact ESM release build

Date: 2026-11-07

## Request and changes

Add a compact `.mjs` and declarations while preserving names. `make build` produces a standalone
release package in `dist/`: one minified ESM bundle, four declarations, two subpath re-export
wrappers, metadata, README, and license. The wrappers preserve class identity across imports.
The existing source-tag installation stays compatible. No dependencies were added.

Maximum Bun minification changed runtime class names even with `--keep-names`, so the build uses
syntax and whitespace minification without identifier minification. Declaration imports are
rewritten to `.js` to resolve without TypeScript source files.

## Validation

- The built tarball is installed offline in an independent Bun consumer and checked at runtime
  and with the pinned TypeScript compiler, including class names and subpath identity.
- `make verify` passed formatting, documentation, harnesses, type contracts, and all 191 runtime
  tests, including both source and built-package integration tests.

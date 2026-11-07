# ADR-003: Compact release artifact alongside GitHub source tags

Status: Accepted

Date: 2026-11-07

## Context

The maintainer requested a compact `.mjs` and TypeScript declarations without changing names.
Existing consumers install repository snapshots through `github:` tags. Those snapshots do not
include an ignored build directory or automatically substitute an uploaded release asset.

## Decision

- Build one minified ESM bundle, retaining class and public method names, using the pinned Bun.
  Disable identifier minification because Bun 1.4.2 changes class names even with `--keep-names`.
- Generate declarations using the existing pinned TypeScript compiler and rewrite their relative
  `.ts` specifiers to `.js` so they resolve without shipping source files.
- Generate two small JavaScript entry wrappers around the bundle to preserve existing public
  subpaths and the identity of shared classes. Ship a standalone manifest, README, and license.
- Test the packed build in a separate offline Bun consumer, including TypeScript contracts,
  subpath identity, and runtime class names. Retain the existing source-package consumer test.
- Offer the build as a release archive without changing source-tag exports or requiring install
  scripts. A release, remote change, or new tag still requires separate explicit authorization.

## Consequences

The built tarball excludes source and development dependencies. Existing GitHub source-tag
consumers remain compatible but continue to download a repository snapshot. Consumers wanting the
compact archive can install the release asset URL after it is published. The ESM output is not a
claim of officially supported Node or browser environments; those need separate compatibility tests.

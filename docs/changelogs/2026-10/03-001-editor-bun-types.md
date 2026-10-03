# Discover Bun types in the editor

Date: 2026-10-03

## Request and cause

Make Bun imports work in VS Code with the existing editor installation. The root source configuration
only includes `src/` and disables ambient runtime types. The CLI explicitly selects `tsconfig.test.json`,
but the editor does not discover that custom filename for tests or scripts.

Opening `tests/unit/combinators.test.ts` through the installed VS Code TypeScript 6.0.3 project service
reproduced an inferred project, TS2307 for `bun:test`, and TS5097 for a relative `.ts` import while
`make typecheck` passed.

## Changes

- Made `tsconfig.json` the central shared configuration and editor entry point, with no root files
  and references to separate library and test/tooling projects.
- Added `tsconfig.lib.json` for pure source; scoped `tsconfig.test.json` to tests and scripts. Both
  extend the central configuration. The typecheck command explicitly checks both leaf projects.
- Preserved explicit Bun types, symlink resolution, strict checking, pure-source isolation, and
  standalone package-consumer fixtures.
- Documented editor discovery and how to restart the language service if diagnostics remain stale.
- No dependencies, VS Code extensions, or compiler versions were changed.

## Validation

- The installed VS Code TypeScript 6.0.3 project service assigns unit and integration tests and both
  repository scripts to `tsconfig.test.json`, with Bun types and zero semantic or compiler-option
  diagnostics in the checked files.
- The same editor check assigns `src/index.ts` to `tsconfig.lib.json` and consumer contracts to their
  standalone configuration; both retain `types: []` and zero diagnostics.
- `make verify` passed documentation, harnesses, both TypeScript compiler projects, and all 187 runtime
  tests, including packed-package consumption. Checking the central configuration separately also
  passed, but does not replace checking both leaf projects.
- `git diff --check` passed. The active VS Code window was not restarted through tooling; restart
  its TypeScript server if it retains cached diagnostics.
- The maintainer confirmed the configuration works in VS Code and authorized committing and pushing
  the change to the existing repository.

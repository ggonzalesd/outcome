# Ambient type resolution with the global store

Bun 1.4.2's `bun-types` references `undici-types`, supplied transitively through Node types, while
its own package manifest only declares `@types/node`. `undici-types` also uses Node ambient types.
Realpath-based TypeScript resolution from the global store cannot find all these ambient references
through the project's hidden hoisted layer.

The observed symptoms were missing `undici-types` imports and missing `node` type references when
checking test/tooling declarations. Runtime unit tests still passed; that was not sufficient evidence
for the type contract.

The project exposes `bun-types`, `@types/node`, and `undici-types` through `publicHoistPattern`, and
the test compiler uses `preserveSymlinks: true`. Resolution follows the project-visible links while
the underlying packages remain in shared storage. This does not add new direct dependencies or
disable declaration checking.

The pure-source compiler keeps `types: []` and `skipLibCheck: false`. Do not propagate Bun or Node
types into that compiler project. Reassess this workaround when updating the pinned type packages.

## Editor project discovery

VS Code discovers ancestor files named `tsconfig.json`. Custom configuration filenames need to be
reachable through its project references. Without that entry point, tests and scripts enter inferred
projects and can report missing `bun:test` declarations and errors for relative imports ending in
`.ts`, even when `make typecheck` passes by explicitly selecting the test configuration.

The central `tsconfig.json` contains shared strict options, `files: []`, and references to both compiler
projects. `tsconfig.lib.json` extends it and includes only `src/`, retaining `types: []`.
`tsconfig.test.json` extends it and includes tests and scripts, enabling Bun types and symlink
preservation while excluding consumer fixtures. Source imported by tests is also checked in that
project. The independent consumer fixtures retain their own configuration.

`make typecheck` explicitly checks both leaf configurations with `tsc --noEmit -p`; selecting only
the central configuration is not a substitute for checking the library and tests. The references
provide editor discovery, without adding a build pipeline or emitted artifacts.

After updating the configuration, run **TypeScript: Restart TS Server** in VS Code if stale errors
remain. This project-discovery fix works with the installed VS Code TypeScript 6.0.3 language service;
it does not require a new extension or changing the project's TypeScript 7.0.2 compiler.

References: [Bun global store](https://bun.com/docs/pm/global-store),
[TypeScript preserveSymlinks](https://www.typescriptlang.org/tsconfig/preserveSymlinks.html),
[TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html).

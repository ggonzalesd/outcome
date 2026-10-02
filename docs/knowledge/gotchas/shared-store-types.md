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

References: [Bun global store](https://bun.com/docs/pm/global-store),
[TypeScript preserveSymlinks](https://www.typescriptlang.org/tsconfig/preserveSymlinks.html).

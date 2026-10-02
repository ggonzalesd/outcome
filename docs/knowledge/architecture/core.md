# Pure class core architecture

The library has one pure domain core, based on the maintainer's Result and Option classes in
courses-project. There are no application services or infrastructure adapters to justify extra
layers. result.ts owns Result and its plain discriminated view; option.ts owns Option and its
nested/flattened types; unwrap-error.ts owns the absent-Option invariant error.

Each class retains a private constructor, PascalCase static factories and functional counterparts,
and camelCase instance methods. There is no public variant hierarchy and no shared base class.
Wrappers are frozen. Result's plain state is frozen as well; payloads and error values retain their
identity and mutability. Result unwrap throws the original error; Option unwrap uses UnwrapError.

Result and Option refer to one another for conversions. Neither invokes the other during module
initialization; calls happen only during consumer operations. The packaged integration test covers
both direct subpath entries, exported class identity, and conversion behavior.

Tests and scripts may use Bun and Node-compatible APIs. Source imports never point to them.
Separate compiler projects keep runtime ambient declarations outside the core. Type contracts and
runtime tests check different guarantees.

[ADR-002](../decisions/ADR-002-preserve-reference-class-api.md) records the source baseline,
demonstrated corrections, preserved semantics, and compatibility changes. The reference repository
is read-only during this work. Other libraries are not the source of the implementation or API.

The agent setup retains one manual, thin harness pointers, playbooks, ADRs, changelogs, and uniform
verification commands. Product services, deployment, monorepo scaffolding, and local agent state
remain outside this focused library.

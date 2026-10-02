# ADR-001: A focused pure core distributed from GitHub

Status: Superseded for the core API by [ADR-002](ADR-002-preserve-reference-class-api.md).
The GitHub-only distribution and tooling decisions remain in effect.

Date: 2026-10-01

## Context

The maintainer requested a dedicated Bun/TypeScript library for Result and Option, a Git repository,
unit testing, and an agent setup based on the courses-project reference. Registry publication and
unrelated shared utilities are outside the requested scope.

The reference uses a unified class and a plain discriminated view. Some helpers conflate `void`
with `never`, and its sync capture method also returns a promise. A new contract should be explicit
rather than preserve those accidental semantics.

## Decision

- One package with a Result core, an Option core, and an unwrap invariant error.
- Discriminated variants with fluent methods and no inheritance.
- Names and semantics inspired by Rust, expressed in TypeScript `camelCase`.
- Explicit Some can hold null or undefined; nullable conversion is a separate operation.
- Sync and async capture boundaries are separate and use `unknown` unless mapped.
- No runtime dependencies; pinned TypeScript and Bun types are development tools only.
- Bun 1.4.2 is pinned through mise, with isolated linking and the global shared store enabled.
- Export TypeScript source for Bun consumption from GitHub. Mark the package private to prevent
  accidental registry publication. Do not require installation-time builds.
- Verify runtime behavior, compile-time contracts, and packed-package consumption independently.
- Keep agent rules in one manual with checked pointers and small documented playbooks.

## Consequences and limits

Compatibility with Node, browsers, or other package managers is not yet a supported distribution
contract. The core avoids runtime-specific dependencies so those formats can be added deliberately.
No upstream GitHub repository, release tag, initial commit, or license is created implicitly.
Collection combinators, deep equality, recursive flattening, and application-specific helpers are
deferred. This decision does not approve any later public API additions.

## References

- [Rust Result](https://doc.rust-lang.org/std/result/enum.Result.html)
- [Rust Option](https://doc.rust-lang.org/std/option/enum.Option.html)
- [TypeScript discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Bun Git dependencies](https://bun.com/docs/pm/cli/add#git-dependencies)
- [Bun global store](https://bun.com/docs/pm/global-store)

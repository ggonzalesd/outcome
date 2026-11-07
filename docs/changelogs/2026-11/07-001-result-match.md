# Add Result branch matching

Date: 2026-11-07

## Request and contract

Add an exhaustive way to resolve a Result into an arbitrary output. `match` requires `success` and
`failure` handlers, executes only the active handler with its original value or error, and returns
its output directly. The handlers may return different types or void. Exceptions propagate and
promises are returned unchanged. The curried static `Result.Match` mirrors `Option.Match`.

## Changes and compatibility

- Added the instance and static methods without changing existing Result behavior.
- Documented the contract and usage, including the existing `optional` conversion.
- Added runtime, TypeScript, and installed-package consumer checks for the new public API.
- This is an additive API change; existing consumers remain compatible. No dependency was added.

## Validation

- Focused unit tests and TypeScript checks passed after verifying they initially failed without the API.
- `make verify` passed formatting, documentation, harnesses, type contracts, and all 190 runtime
  tests, including the installed-package integration test.

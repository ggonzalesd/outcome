# ADR-002: Preserve the maintainer's Result and Option class API

Status: Accepted under the maintainer's instruction to use and improve the reference implementation

Date: 2026-10-01

Supersedes: [ADR-001](ADR-001-core-and-github-distribution.md) for core representation and semantics.
Distribution, mise, shared storage, and agent setup are unchanged.

## Context

The maintainer clarified that the intended base is their own `courses-project` implementation, not
a different library's API. The initial split into public variants and reduced method inventory did
not preserve that intent. The maintainer authorized demonstrated fixes in Outcome while leaving the
reference repository untouched.

The reference was tested directly using its 150 existing cases, adapted from Vitest to Bun.
Matchers for arbitrary thrown values were changed to explicit catch-and-identity checks because the
runners differ; all 150 cases then passed. This is not a claim that the original Vitest workspace
was installed or executed. Its dependencies are not installed in this environment.

Five additional runtime checks demonstrated async capture, mutable plain-view, and Zip key-handling
problems. Strict checking also exposed nullable indexed access in Option.Zip, and review identified
fabricated `never` success values and lost error-channel inference.

## Decision

- Port the maintainer-owned Result and Option classes and preserve every existing public method.
- Keep PascalCase static factories/functional combinators and camelCase instance methods.
- Restore `plain`, `whenNone`, `failSome`, `failSuccess`, `optional`, callbacks, value fallbacks,
  `Switch`, `Collapse`, `Zip`, and `Join`. Add `Tuple` only as a spelling alias for Join.
- Keep Option payloads non-nullable and `Of` as the nullable boundary. Some validates this invariant
  even when called from untyped code.
- Preserve the reference Equals contract: equality requires both values to be present and `===`.
  Two None values intentionally compare false. This was an explicit existing test, not a regression.
- Preserve FailSuccess inversion: existing success becomes failure, existing failure becomes
  `Ok(undefined)`. Correct its success type to `void`, as with FailSome, without changing that behavior.
- Keep Try asynchronous, but await its return value and capture rejection. Promise accepts an
  existing promise; typed error channels require an explicit mapping callback.
- Default Ok to `never` for its error type and defer inference in functional wrappers until the
  Result argument is supplied. Do not fabricate an error type from an unchecked rejection.
- Join/Tuple preserve tuple positions and union member error types. Zip processes all own keys,
  including symbols/non-enumerable fields, ignores inherited keys, and safely retains `__proto__`.
  Inputs to Zip are records with own required fields; no support for inherited-field record contracts
  is promised.
- Freeze wrappers and the Result plain state without freezing payloads. Collapse uses iteration
  instead of recursive runtime calls.
- Keep asResult's factory-or-value convention, constrain unsafe callable error types, and provide
  asResultValue for an explicitly eager value, including a function-valued error.
- Continue checking the pure source, runtime contracts, inference, and package consumption separately.

## Compatibility changes

The initial lowercase variant API is removed. The reference method names are preserved, but the
demonstrated corrections affect some signatures and edge behavior:

- Promise's former unchecked second error generic now needs a mapper. An unmapped rejection is unknown.
- Try unwraps promise-like callback results before constructing success.
- FailSome and FailSuccess successful payloads are void, not never.
- Ok's inferred error type starts as never, not unknown; explicit type parameters remain available.
- Plain state is immutable at runtime. Payloads remain mutable by reference.
- Zip uses own fields and preserves fields previously omitted by for-in enumeration.
- Callable error values must use asResultValue to avoid factory ambiguity.
- Option match permits void and different branch return types.

These changes are recorded rather than presented as perfect source compatibility. No new external
library or runtime dependency was used to implement the core.

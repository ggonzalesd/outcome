# Reference class API audit and restoration

Date: 2026-10-01

## Request

Use the maintainer's implementation in courses-project, verify what already works, and improve
demonstrated problems in Outcome. Do not replace it with another library's API or edit the reference.

## Evidence

- The reference's 150 runtime cases passed after adapting Vitest imports/mocks to Bun and replacing
  matcher assumptions for arbitrary throwables with explicit catch-and-identity assertions.
  The tests ran against the original source through a temporary harness; no reference dependencies
  were installed. This is not a claim that the original Vitest workspace was run.
- Five additional checks failed against the original: Try retained a rejected promise as successful
  payload; plain exposed mutable state; Result.Zip processed inherited entries and omitted own
  symbol/non-enumerable entries; Option.Zip processed inherited absent entries.
- Strict source checking exposed an unchecked indexed access in Option.Zip. Review identified
  fabricated never payloads, restricted/erased collection errors, and lost inference in static wrappers.

## Changes

- Replaced the initial variant API with the maintainer's Result and Option classes and full method
  inventory. Added Tuple as an alias for Join, not a replacement.
- Ported the 150 behavior tests, added five demonstrated regressions and 27 collection/invariant cases,
  and rewrote compile-time contracts and the packed consumer around the actual class API.
- Fixed async rejection capture, mapped unknown errors, immutable plain state, own-key collection
  handling, tuple/error inference, void successes, iterative collapse, void matching, and callable
  error-value conversion.
- Preserved explicit reference semantics: Equals requires presence; FailSuccess inverts failures;
  Option payloads are non-nullable; Result unwrap throws the original error verbatim.
- Updated the manual, README, architecture, and API conventions. ADR-002 supersedes the initial
  core API decision and records compatibility changes.
- Added no dependencies and performed no Git mutations. The original repository stayed unchanged.

## Validation

- `make verify`: passed documentation/harness checks, both strict compiler projects, 182 unit cases,
  and one packaged-consumer integration case (183 runtime cases total).
- `bun run test:coverage`: passed; Bun reported 100% source function and line coverage.
- `make pack-check`: passed; six files selected, including the manifest, README, and four source modules.
- `git diff --check`: passed. Reference `git status --short` and `git diff --stat` remained empty.
- Hosted GitHub Actions still requires a remote and has not been run.

# TypeScript and public API conventions

## Source contract

The maintainer-owned classes in `courses-project` are the API baseline. Keep PascalCase static
methods, camelCase instance methods, and the existing workflows; improve demonstrated faults here
rather than replace the API with another library's design.

`src/` compiles with strict TypeScript, ES2022 built-ins, and no ambient runtime types. Source must
not use Bun globals, Node imports, DOM APIs, framework imports, filesystem, network, or environment
reads. ESM relative imports use explicit `.ts` extensions and type-only imports where appropriate.
The root and `outcome/result`, `outcome/option` are the public package entries.

## Result

- `Result<T, E = unknown>` is a class. `plain()` exposes the frozen `ResultPlain<T, E>` discriminated
  union `{ success: true, value } | { success: false, error }`.
- `Ok(value)` infers `Result<T, never>`; `Fail(error)` infers `Result<never, E>`. Explicit legacy
  generic parameters remain available. Successful commands without a payload use void.
- `map`, `mapError`, `ifSuccess`, and `ifFailure` visit only the active variant. Their functional
  counterparts preserve type inference until an input Result is supplied. Callback exceptions propagate.
- `orElse` extracts a value with an error-dependent fallback. It does not return another Result.
  `orElseThrow` throws the supplied mapped Error only on failure. `unwrap` throws the original error
  value verbatim, even if that value is a string, object, number, null, or undefined.
- `optional` maps success to Option.Of and failure to absence, intentionally discarding the error.
- `whenNone` flattens Result<Option<T>, E>, failing absent success via a lazy callback and preserving
  existing failure. `failSome` instead fails presence and returns Ok(void) on absence.
- `failSuccess` retains the reference inversion: it maps success to failure and turns an existing
  failure into Ok(void). Do not reinterpret it as a failure-preserving operation without a separate
  maintainer-directed semantic change.
- `Try` returns a promise as before, now awaiting callback return values and capturing both sync throws
  and async rejection. `Promise` captures an already-created promise. Expressions evaluated before
  calling Promise are outside its capture boundary; use Try with a deferred callback for those.
- Unmapped captured errors are unknown. A typed error needs a mapper. Mapper exceptions propagate.

## Option

- `Option<T extends NonNullable<unknown>>` is a class; a payload is present unless null/undefined.
- `Some` requires a non-nullable value, in both types and runtime. `Of` interprets nullable input as
  absence; 0, false, and empty strings remain present. `None<T>()` stores null. `get()` retains the
  reference return type `T | null | undefined` and the nullable sentinel passed to Of.
- An absent Option's map/filter output is a new None storing null, even when Of received undefined.
  Preserve this distinction when changing presence checks or considering instance reuse.
- `map` requires non-nullable output. Use `Result.optional` or a nullable boundary when absence is
  intended. `filter`, `ifSome`, and `ifNone` retain their original lazy branch behavior.
- `orElse(value)` extracts the payload or supplied fallback, not another Option. `orElseThrow`
  computes and throws an Error only on absence. `unwrap` throws UnwrapError on absence.
- `asResult` keeps the original error-factory/non-callable-value convention. Factories run only on
  absence. Use `asResultValue` for an eager error value, especially a callable value.
- `Equals`/`equals` require both payloads to be present and use ===. None equals None is intentionally
  false, matching the reference tests. Equality is not deep equality.
- `switch` transforms Option<Result<T,E>> into Result<Option<T>,E>. `collapse` recursively removes
  Option layers semantically, using an iterative runtime loop. These checks use this library's class
  identity; do not promise interoperation with unrelated Option implementations.
- `match` requires both branches and supports void and differing return types.

## Collections and casts

Join combines tuples or arrays. Tuple is its alias. Preserve positions in tuples, and short-circuit
on the first Result failure or absent Option. Result collections union all possible member errors
rather than restrict them to Error or erase them as unknown. Empty inputs succeed with [] or {}.

Zip accepts a record with own required container fields. Visit every own key with Reflect.ownKeys,
including symbols and non-enumerable fields. Ignore inherited entries. Use safe object construction
so an own __proto__ key is a payload field, not a prototype mutation.

TypeScript cannot prove a generic mapped tuple or record is complete after a runtime loop. Local
shape assertions are permitted only after every input has contributed its corresponding output;
explain the invariant beside each assertion. Do not use double casts or invent never payloads.

## Testing changes

The original 150 behavior cases are adapted to Bun, with catch-and-identity assertions for arbitrary
throwables where Vitest and Bun matchers differ. Add regressions for demonstrated failures and tests
for collection ordering, lazy branches, conversion, and invariants. Compile-time contracts check
inference, guards, tuples, errors, and forbidden calls; every @ts-expect-error explains its purpose.

Share arbitrary-throwable assertions through tests/helpers/expect-thrown.ts. Group equivalent
scenarios with table-driven cases while retaining their independent runtime checks.

The package integration test packs the library and declares the local tarball as a dependency of an
independent temporary Bun consumer. Bun installs it with --offline and --ignore-scripts, an isolated
linker, globalStore enabled, and a disposable cache. Do not create manual links to src or unpacked
files as a substitute for installation. Runtime execution disables auto-install and covers classes,
public subpaths, original methods, and exported identity. Installed contents exclude repository
tooling and do not pull in the library's development dependencies. Include LICENSE alongside the
source and README, and verify the installed license text and manifest licensing/repository metadata.

Consumer fixtures live in tests/fixtures/package-consumer and are excluded from the repository's
test compiler. The integration test copies them into the consumer and invokes the already-installed,
pinned TypeScript compiler against their standalone tsconfig. It has no repository extends, path
aliases, ambient Bun/Node types, or skipLibCheck. Positive inference checks and explained negative
calls must resolve the installed package's public entries, never relative src imports. This checks
local tarball installation and consumption; GitHub fetching and authentication need separate
validation once a remote exists. No network, services, or external tar executable is required.

Run make verify. Coverage measures execution; it does not prove semantics or type correctness.

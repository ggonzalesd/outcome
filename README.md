# Outcome

The maintainer's Result and Option class API, extracted from courses-project and improved through
behavior and type checks. Bun/TypeScript development, GitHub distribution, and no runtime dependencies.

Result and Option remain classes with PascalCase static methods and camelCase instance methods.
The implementation is based on the maintainer-owned reference, not another library's API.

## Result

```ts
import { Option, Result } from "outcome";

type ParseError = { code: "invalid-number"; input: string };

function parseNumber(input: string): Result<number, ParseError> {
  const value = Number(input);
  return input.trim() !== "" && Number.isFinite(value)
    ? Result.Ok(value)
    : Result.Fail({ code: "invalid-number", input });
}

const result = parseNumber("21").map((value) => value * 2);
const plain = result.plain();
if (plain.success) {
  console.log(plain.value); // number
} else {
  console.log(plain.error.code); // ParseError
}
```

`Result<T, E = unknown>` stores either success or failure. `Result.Ok(value)` infers an error channel
of never; `Result.Fail(error)` infers a success channel of never. Explicit type parameters are also
available, as in the reference. Commands that succeed without a payload use Result<void, E>.

| Static method | Instance method / behavior |
|---|---|
| `Ok(value)`, `Fail(error)` | Construct a Result |
| `Plain(result)` | `plain()` exposes a frozen `{ success, value/error }` view |
| `Unwrap(result)` | `unwrap()` extracts success or throws the original error verbatim |
| `Map(fn)` | `map(fn)` transforms success and keeps the error type |
| `MapError(fn)` | `mapError(fn)` transforms failure and keeps the value type |
| `Optional(fn)` | `optional(fn)` converts success through Option.Of; failure becomes absence |
| `WhenNone(fn)` | `whenNone(fn)` extracts Result<Option<T>> or lazily fails on absence |
| `FailSome(fn)` | `failSome(fn)` fails presence, succeeds with void on absence, retains existing failure |
| `FailSuccess(fn)` | `failSuccess(fn)` inverts success to failure and existing failure to Ok(void) |
| `Join(results)`, `Tuple(results)` | Combine tuple/array values; return the first failure |
| `Zip(record)` | Combine own record fields; return the first failure |
| `Try(fn, mapper?)` | Capture synchronous throws and rejected return values asynchronously |
| `Promise(promise, mapper?)` | Capture an existing promise's rejection |

Additional instance methods retain the reference contract:

- `ifSuccess(fn)` and `ifFailure(fn)` observe the active branch and return the same Result instance.
- `orElse(fn)` extracts success or computes a value from failure. It does not return another Result.
- `orElseThrow(fn)` extracts success or throws the Error produced from failure.

Ordinary callback exceptions propagate. Result errors can be arbitrary typed values; unwrap does
not wrap them in a different Error class. Prefer plain/error handling for expected failure.

## WhenNone and functional composition

```ts
const required = Result.Ok(Option.Some(21))
  .whenNone(() => ({ code: "missing" as const }))
  .map((value) => value * 2);

const composed = await Promise.resolve(Result.Ok(Option.Some(21)))
  .then(Result.WhenNone(() => ({ code: "missing" as const })))
  .then(Result.Map((value: number) => value * 2))
  .then(Result.Plain);
```

Functional wrappers preserve value and error types when their input arrives. `whenNone` only
computes its new error for a successful Result holding an absent Option. Existing errors propagate.

FailSuccess deliberately retains the reference's inversion: an existing failure becomes success
without a value. FailSome instead preserves an existing failure. Their void return types reflect
these successful undefined payloads; neither fabricates a never value.

## Zip and tuples

```ts
const name: Result<string, "invalid-name"> = Result.Ok("Ada");
const age: Result<number, "invalid-age"> = Result.Ok(37);

const record = Result.Zip({ name, age });
// Result<{ name: string; age: number }, "invalid-name" | "invalid-age">

const tuple = Result.Tuple([name, age]);
// Result<[string, number], "invalid-name" | "invalid-age">

const optionalTuple = Option.Join([Option.Some("Ada"), Option.Some(37)]);
// Option<[string, number]>
```

Join is the original reference name; Tuple is an alias. Both accept readonly tuples and arrays,
retain positions, and stop at the first failed/absent member. Empty collections produce [] or {}.

Zip visits all own record fields, including symbols and non-enumerable properties, and ignores
inherited properties. An own __proto__ field is safely retained as data. Input contracts must
represent records with own required container fields.

## Option

```ts
const name = Option.Of<string>(undefined).orElse("Anonymous");
const requiredName = Option.Of<string>(undefined).asResult(() => ({ code: "name-required" as const }));
const count = Option.Of(0).map((value) => value + 1).unwrap(); // 1
```

`Option<T extends NonNullable<unknown>>` holds a non-nullable payload or absence. `Some` rejects
null and undefined; `Of` accepts them as absence. 0, false, and empty strings remain present.

| Static method | Instance method / behavior |
|---|---|
| `Some(value)`, `None<T>()`, `Of(value)` | Construct presence or absence |
| `Equals(first, second)` | `equals(other)` compares present payloads using === |
| `Map(fn)` | `map(fn)` transforms a present payload to a non-nullable value |
| `Filter(fn)` | `filter(fn)` retains a present payload only when the predicate passes |
| `Unwrap(option)` | `unwrap()` extracts presence or raises UnwrapError |
| `Match(patterns)` | `match({ some, none })` executes one handler, including void handlers |
| `Collapse(option)` | `collapse()` removes nested Option layers iteratively |
| `Switch(option)` | `switch()` transforms Option<Result<T,E>> into Result<Option<T>,E> |
| `Join(options)`, `Tuple(options)` | Combine tuple/array values; any absence yields None |
| `Zip(record)` | Combine own record values; any absence yields None |

Additional instance methods:

- `get()` retains `T | null | undefined`; Of keeps its nullable input sentinel and None stores null.
- `orElse(value)` extracts presence or uses the supplied value.
- `orElseThrow(fn)` computes and throws an Error only on absence.
- `ifSome(fn)` and `ifNone(fn)` observe one branch and return the same Option instance.
- `asResult(errorOrFactory)` retains the reference conversion. A function argument is a lazy factory.
- `asResultValue(error)` always treats its argument as an error value, including a callable value.

Equals requires both values to be present. Two None values intentionally compare false, as in the
reference tests; this is neither deep equality nor mathematical equality over all Option values.

```ts
const errorValue = () => "callable-error";
const missing = Option.None<number>().asResultValue(errorValue);
// The error is errorValue itself, which was not invoked.

const flattened = Option.Collapse(Option.Some(Option.Some(Option.Some(1)))); // Option<number>
const switched = Option.Some(Result.Ok(1)).switch(); // Result<Option<number>, never>
```

Wrappers and Result's plain state are frozen. Payloads remain mutable by reference. Collapse and
Switch use this package's class contracts, not unrelated Option implementations.

## Async capture

Try keeps the reference asynchronous signature and now awaits returned promises or thenables.
Promise operates on an existing promise. Unmapped errors are unknown; typed errors need a mapper.

```ts
const parsed = await Result.Try(
  (): unknown => JSON.parse('{"count":1}'),
  (cause) => ({ code: "invalid-json" as const, cause }),
);

const loaded = await Result.Promise(
  Promise.resolve("loaded"),
  (cause) => ({ code: "load-failure" as const, cause }),
);
```

Use Try with a deferred callback when constructing the promise can itself throw; evaluation before
calling Promise is outside its capture boundary. Exceptions from error mappers propagate.

## GitHub consumption

The repository is [ggonzalesd/outcome](https://github.com/ggonzalesd/outcome). The package exports
TypeScript source for Bun through the root, `outcome/result`, and `outcome/option`. No registry
publication or installation-time build is required. Install the first functional version, v0.1.0:

```json
{
  "dependencies": {
    "outcome": "github:ggonzalesd/outcome#v0.1.0"
  }
}
```

Run bun install and track the consumer's bun.lock. Version tags identify fixed revisions and are
never moved after publication. To upgrade, select a new version tag and update the lockfile. A full
commit reference can also pin a revision. See the [v0.1.0 release notes](docs/releases/v0.1.0.md).
The private package.json flag prevents registry publication, not GitHub visibility. A supported
Node/browser distribution has not yet been added.

Shared storage is configured by the consumer or its global Bun configuration. To enable it in a
consumer's bunfig.toml:

```toml
[install]
linker = "isolated"
globalStore = true
```

Installing Outcome does not apply this repository's Bun or mise settings to the consumer.

## Development and verification

Bun 1.4.2 is pinned through mise. TypeScript, Bun types, and Prettier are development-only dependencies with
exact versions and bun.lock. After obtaining any required installation approval, use
`bun install --frozen-lockfile`. The isolated linker and global store reuse the personal Bun cache;
no workstation path is committed. Test-only ambient type links preserve shared storage.

```sh
make format
make format-check
make verify
make test-unit
make test-integration
make typecheck
bun run test:coverage
make pack-check
```

Prettier formats TypeScript, root JSON/JSONC configuration, CI YAML, and the shared VS Code settings.
`make format` writes formatting changes; `make format-check` checks without modifying files, and
`make verify` includes that check. Markdown, TOML, and Makefiles retain their existing layout.
The configuration uses two spaces, double quotes, semicolons, trailing commas, LF, and an 80-column
print width, consistent with `.editorconfig`. VS Code uses the recommended Prettier extension and
formats supported files on save using the project's installed formatter version.

The original 150 behavior cases are adapted to Bun and checked alongside additional regression and
collection cases. This does not claim execution of the original Vitest workspace. Compile-time
contracts check inference and forbidden calls. The integration test packs the library and installs
the local tarball into a separate temporary Bun consumer with offline mode and lifecycle scripts
disabled. It checks runtime behavior and public imports through an independent strict tsconfig,
using the repository's pinned compiler. A disposable cache isolates installation from the personal
cache; no development dependencies are installed into the consumer. This verifies local package
installation, not GitHub fetching or authentication.

[The agent manual](AGENTS.md), [documentation index](docs/README.md), and
[the class API decision](docs/knowledge/decisions/ADR-002-preserve-reference-class-api.md) document
workflow, evidence, and compatibility changes. CI runs the same checks and does not publish.

## License

MIT. See [LICENSE](LICENSE). The license is included in the installed package.

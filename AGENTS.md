# AGENTS.md — Outcome operating manual

Read this file before changing the repository. It is the shared source of truth for agent rules;
tool-specific files are pointers, not separate manuals.

## 1. Purpose and scope

Outcome contains only `Result<T, E>` and `Option<T>` and their immediate supporting contracts.
Develop and test with Bun managed by mise. Distribute from GitHub; do not publish to a registry.
The initial distribution exports TypeScript source for Bun consumers.

There is one pure core, not an application with services or adapters. Do not add empty domain,
application, or infrastructure layers. Keep filesystem, network, runtime, and tooling concerns in
`tests/` or `scripts/`; never import them from `src/`.

## 2. Language and code

- Communicate with the maintainer in Spanish. Code, documentation, and external research use English.
- Strict TypeScript: no `any`, `Function`, `@ts-ignore`, or unchecked casts to fabricate values.
- Use `unknown` for caught exceptions and narrow it or map it explicitly.
- Public contracts have JSDoc. Keep each primitive cohesive; share behavior through composition,
  not a base class. Reuse local conventions before adding abstractions or dependencies.
- Wrappers are immutable. Payloads are retained by reference, not deeply frozen or copied.
- Preserve the maintainer-owned class API from `courses-project`: PascalCase static methods and
  camelCase instance methods. Do not replace it with another library's API or separate public variants.
- Expected failures are values. Ordinary combinator callbacks may throw; `Result.Try` and
  `Result.Promise` capture throws/rejections as `Result.Fail`. `unwrap` is an intentional escape hatch
  and throws the original Result error; only absent Option unwrap raises `UnwrapError`.
- Model success without a payload as `void`; `never` means no possible value.
- `Option<T>` holds a non-nullable payload. `Option.Some` rejects nullable input; `Option.Of` accepts
  it as absence. Keep reference semantics unless a demonstrated problem justifies a recorded change.
- New public API names and semantic changes need a recorded contract and focused tests first.
- Do not add application-specific helpers, framework integration, runtime dependencies, or a
  second `Result`/`Option` implementation.

## 3. Ownership map

| Path | Responsibility |
|---|---|
| `src/result.ts` | Result class, plain discriminated view, combinators, exception boundaries |
| `src/option.ts` | Option class, collection combinators, conversions, nullable boundary |
| `src/unwrap-error.ts` | Programmer error for invalid unwrap operations |
| `src/index.ts` | Public root exports |
| `tests/unit/` | Behavior, laziness, error propagation, and composition laws |
| `tests/types/contracts.ts` | Inference, narrowing, and rejected misuse |
| `tests/integration/` | Packed-package consumption by a separate Bun project |
| `scripts/` | Repository checks; never shipped as library code |
| `docs/` | Decisions, playbooks, architecture, and session history |

## 4. Workflow and permissions

1. Read `git status`, then [change triage](docs/playbooks/change-triage.md), the relevant contract
   in [API conventions](docs/conventions/typescript.md), and the latest relevant changelog.
2. Work on the smallest change that satisfies the request. For a regression, follow
   [bug fix](docs/playbooks/bug-fix.md). Record meaningful new decisions as an ADR.
3. Run focused checks while changing code, then `make verify` before handing it off.
4. Update the relevant documentation and a session entry under `docs/changelogs/`.

Git reads are free. Mutations, including init, add, branch creation, fetch, pull, merge, rebase,
reset, checkout, commit, push, tags, remotes, and PR creation need explicit authorization in the
conversation. An explicit request for that operation counts; do not ask again when already approved.
See [Git workflow](docs/playbooks/git-workflow.md).

When the maintainer authorizes progressive commits, commit each completed, verified, cohesive slice
before starting the next one. Keep implementation, its tests, and relevant documentation together.
Do not accumulate all work until hand-off or ask again for an authorization already granted in the
conversation. Progressive commit authorization does not authorize a push or remote changes.

Ask before adding or installing dependencies unless the current conversation already authorizes
the exact work. Use Bun, not npm or pnpm, in this repository. Keep versions exact and `bun.lock`
tracked. Preserve the global cache and shared-store configuration; do not install project tools
globally or modify shared cached package files.

Do not commit, push, create a remote, publish, or assign a license implicitly. Do not copy local
credentials, tool state, or reference-project rules unrelated to this library.

## 5. Verification

| Command | Scope |
|---|---|
| `make format` | Apply project formatting |
| `make format-check` | Check project formatting without writes |
| `make test-unit` | Unit tests |
| `make test-integration` | Package/consumer boundary without network or services |
| `make typecheck` | Pure source, tooling, tests, and compile-time contracts |
| `make docs-check` | Relative documentation targets |
| `make harness-check` | Supported harness pointers and shared instruction loading |
| `make pack-check` | Package file selection without producing an artifact |
| `make verify` | Formatting, documentation, harnesses, types, and all runtime tests |

Equivalent Bun scripts are in `package.json`; mise tasks are in `mise.toml`. Tests must not pass
silently when absent. Do not substitute runtime success for checking TypeScript contracts. Document
any check that could not run and why.

## 6. Harnesses

Codex reads this manual directly. Claude, Gemini, Cursor, Copilot, and OpenCode route here through
thin entry points documented in [the harness map](docs/harness.md). Local agent state stays ignored.
Do not create another instruction source or spawn subagents without explicit authorization.

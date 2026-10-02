# Verify installation and types from an independent consumer

Date: 2026-10-01

## Request

Strengthen the local package-consumption test before preparing GitHub distribution. The former test
extracted the tarball and manually linked it into node_modules; it verified execution but not package
installation or type checking from a consumer project.

## Changes

- Declare the packed local tarball in a temporary consumer's dependencies and install with Bun's
  offline mode, lifecycle scripts disabled, isolated linking, and globalStore enabled.
- Use a disposable cache so the test does not modify the maintainer's shared cache. All generated
  consumer, lockfile, package, and cache files are removed with the test-owned temporary directory.
- Move runtime examples into a consumer fixture and retain root/subpath class identity, original
  methods, async capture, arbitrary errors, and absent Option unwrap checks.
- Add installed-package type contracts for root/subpath imports, tuple positions, record values,
  error unions, nullable boundaries, async capture, public types, and rejected misuse.
- Compile both consumer fixtures with a standalone strict tsconfig and the repository's already
  installed compiler. The consumer has no compiler or Bun/Node ambient type dependencies, source
  aliases, repository config inheritance, or skipped declaration checking.
- Check the generated lockfile, installed file selection, and absence of installed development tools.
  Remove the external tar requirement and document the new boundary.

## Validation

- make test-integration passes the real local installation, consumer compiler, and runtime checks.
- make verify passes both repository compiler projects, documentation and harness checks, and all
  187 runtime tests (186 unit tests and one integration test).
- make pack-check selects the same six package files; consumer fixtures and repository tools are
  excluded. No new dependency or installation-time build was added.

## Limits

This verifies a local tarball, not a GitHub URL, tag resolution, or repository authentication.
Source exports remain the supported Bun distribution; no JavaScript build or release was created.

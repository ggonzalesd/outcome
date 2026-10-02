# Publish main, verify GitHub consumption, and correct CI cache setup

Date: 2026-10-01

## Authorization and publication

The maintainer authorized connecting origin, integrating the existing GitHub initialization, and
pushing main with the verified contents of c4248a0 to https://github.com/ggonzalesd/outcome.

- Added origin and fetched main; confirmed its only file was the identical MIT LICENSE.
- Integrated the independent histories in b3c630c90f2c396276620b342e05b9fb656a720d, preserving
  both roots. Its tree is identical to c4248a0, with no conflicts or force push.
- Ran make verify before the merge commit and pushed main, establishing upstream tracking.

## GitHub consumer evidence

Installed github:ggonzalesd/outcome#b3c630c90f2c396276620b342e05b9fb656a720d in a disposable
consumer using Bun 1.4.2, isolated linking, shared storage, and disabled lifecycle scripts.

- Bun installed one package, without the library's development dependencies.
- The existing consumer fixtures passed standalone strict TypeScript checking and runtime execution:
  success 42, missing error preserved, and absent unwrap identified as UnwrapError.
- Root/subpath class identity, collection/conversion methods, async capture, and rejected type misuse
  were checked through installed public imports. LICENSE matched the approved text.
- bun.lock retained the requested full revision; an offline frozen-lockfile reinstall passed.
- The package resolved into the disposable cache's links store. GitHub installation retains the
  repository snapshot, including tests/docs; packed tarball file selection is a separate boundary.
- Updated README installation instructions to use the revision actually verified and explain
  consumer-owned shared-storage configuration. No tag or release was created.

## CI regression and correction

The [first Actions run](https://github.com/ggonzalesd/outcome/actions/runs/36958994060) failed
validation before any jobs were created. Its annotation rejected runner.temp in jobs.verify.env.
The workflow's YAML syntax was valid, but that context is unavailable at the job-env location.

Move cache configuration into a runner step that writes BUN_INSTALL_CACHE_DIR to GITHUB_ENV using
RUNNER_TEMP. Later steps keep the same shared-cache location and configuration. Checkout, cache,
and mise-action tag references were verified to exist; their versions did not cause this failure.

Local make verify passes all 187 tests, both compiler projects, documentation, and harness checks;
make pack-check selects the seven intended files. Hosted validation of the correction requires
pushing the corrective commit. The failed hosted run is not represented as successful CI.

Reference: [GitHub context availability](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability).

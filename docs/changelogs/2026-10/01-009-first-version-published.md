# Publish and verify v0.1.0

Date: 2026-10-01

## Published version

- Committed the version-specific README and release notes in
  941a745be0d38d2c735887928f74223e6a2b42b1 and published main after local verification.
- [CI passed for that revision](https://github.com/ggonzalesd/outcome/actions/runs/36959992075).
- Created and published the annotated v0.1.0 tag, object
  73c04dc20df8dd18170ddc1d1c25c4ab21a5db6a. GitHub confirmed its target is the exact commit above.
- package.json remains version 0.1.0. No registry publication or hosted release object was created.
  The published tag is fixed; this verification record is a subsequent documentation commit.

## Consumer validation

Installed github:ggonzalesd/outcome#v0.1.0 using Bun 1.4.2 in a disposable consumer with isolated
linking, globalStore enabled, and disabled lifecycle scripts. The consumer installed one package
without the library's development dependencies and resolved into the temporary cache's links store.

- Standalone strict TypeScript checking passed for all consumer fixtures, using public root/subpath
  imports and positive/negative contracts without repository config inheritance or ambient Bun types.
- Runtime output matched success 42, preserved missing error, and identified absent unwrap as
  UnwrapError. Class identity, collection/conversion methods, and async capture checks passed.
- Installed package.json, LICENSE, README, release notes, and all four source modules matched the
  approved version's contents.
- bun.lock retained v0.1.0 and tarball integrity. Its resolved package entry used the abbreviated
  annotated tag object, 73c04dc, rather than the peeled commit hash. An initial diagnostic assumption
  that both hashes would match was corrected; the library's installation and type/runtime checks
  were already passing. Verify the tag target through GitHub and compare installed contents instead.
- Removed the test-owned node_modules and successfully reinstalled with --offline --frozen-lockfile;
  runtime execution still passed afterward. All test-owned consumer/cache files were cleaned up.

Local make verify passes all 187 runtime tests, both compiler projects, documentation, and harness
checks; make pack-check selects the same seven package files. These hosted/manual checks do not add
network access to the regular verification suite or change the published tag.

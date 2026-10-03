# Prepare the v0.1.1 patch tag

Date: 2026-10-03

## Request and scope

The maintainer requested a new tag after authorizing and publishing the editor and formatting
commits. Select v0.1.1 as the next patch version. The existing origin is ggonzalesd/outcome, and
remote tag inspection confirmed only v0.1.0 exists before preparing this release.

## Changes

- Bumped package.json to 0.1.1 and updated the README's GitHub installation example and release link.
- Added version-specific notes for the editor discovery fix and project formatting. The public
  Result/Option contracts and runtime behavior are unchanged.
- Dependencies and their resolutions are unchanged. Bun's existing root workspace lockfile entry
  contains the package name and dependencies but does not store its own version, so no lockfile
  update or dependency installation is required for this version bump.
- Prepare an annotated v0.1.1 tag on the verified release commit and publish that commit and tag
  to the existing origin without moving v0.1.0.

## Validation

- `make verify` passed formatting, documentation, harnesses, both compiler projects, and all 187
  runtime tests with 287 assertions, including packed-package consumption at version 0.1.1.
- `make pack-check` selected the same seven package files and the artifact name `outcome-0.1.1.tgz`.
- `git diff --check` passed. No dependencies or library source changed in release preparation.

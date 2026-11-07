# Prepare v0.2.0 release

Date: 2026-11-07

## Request and changes

Prepare the first GitHub Release with the compact build and the new Result.match API. Select
v0.2.0 after inspecting the existing v0.1.0 and v0.1.1 tags and finding no GitHub Releases.
Update the package version, installation example, and release notes. No dependency changes are
required; the Bun lockfile does not store the root package version.

The release asset is the standalone compiled package. The existing GitHub tag installation
continues to use the source snapshot. Published tags must not be moved.

## Validation

- `make verify` passed formatting, documentation, types, and all 191 runtime tests, including
  offline installation of both the source and compiled packages.
- Built and inspected `outcome-0.2.0.tgz`: its manifest reports 0.2.0 and its ten files include the
  ESM bundle, declarations, subpath wrappers, README, and license.

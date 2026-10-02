# Prepare the first functional version tag

Date: 2026-10-01

## Request

The maintainer requested version tags for the first functional version. Prepare v0.1.0, matching
the existing package.json version, for ggonzalesd/outcome. A Git tag is sufficient for installation;
no registry publication or separate hosted release is required.

## Changes

- Replace the README's commit dependency with github:ggonzalesd/outcome#v0.1.0.
- Add release notes describing the supported Bun/TypeScript source distribution, original class
  API, corrected contracts, MIT licensing, and version-specific installation.
- Document that published tags stay fixed and consumers commit their lockfiles and explicitly
  select a new version when upgrading. No library source or dependency version changed.

## Evidence and publication sequence

Main was clean and synchronized with fc7de1efa975e31db3cce5ca64e04c803263327a on GitHub. No local
or hosted tags existed. The [CI correction run](https://github.com/ggonzalesd/outcome/actions/runs/36959479379)
passed all verification and packing steps; the earlier session entry records the investigation
before that hosted result was available.

Local make verify passes all 187 runtime tests, both compiler projects, documentation and harness
checks. make pack-check selects the same seven files. Commit and publish the prepared documentation,
confirm its CI, create an annotated v0.1.0 tag on that concrete revision, and push only that tag.
Then verify GitHub installation by tag, consumer type/runtime contracts, and a frozen offline
reinstall. Tag publication and consumption results are reported after those operations succeed.

# Configure project formatting

Date: 2026-10-03

## Request and scope

Configure formatting consistently in the project and VS Code. The repository already has
`.editorconfig`, and the maintainer's VS Code already has the Prettier extension. Pre-existing
formatting edits in `src/option.ts` and `src/result.ts` are retained.

## Configuration

- Installed Prettier 3.9.9 as an exact development dependency after approval, updating `bun.lock`
  while preserving the shared Bun cache, isolated linker, and global-store configuration.
- Added an explicit Prettier configuration and ignore file, preserving the existing two-space and
  LF conventions and using double quotes, semicolons, trailing commas, and an 80-column print width.
- Added write/check commands through Bun, Make, and mise; the check is part of regular verification
  and therefore the existing CI job.
- Shared only VS Code settings and extension recommendations, retaining ignored local editor state.
  Existing format-on-save configuration is preserved and Prettier is selected for supported languages.
- Formatting covers TypeScript and JSON/JSONC/YAML tooling configuration. Documentation, TOML, and
  Makefiles retain their existing layout.

## Validation

- `make format` applied the initial formatting baseline. The maintainer's existing source edits
  already matched the selected style and were unchanged by this command.
- `make verify` passed formatting, documentation, harnesses, both compiler projects, and all 187
  runtime tests with 287 assertions, including independent packed-package consumption.
- `make pack-check` selected the same seven library package files; formatter/editor configuration
  remains repository tooling rather than shipped library files.
- `git diff --check` passed. No new editor extension was installed; the existing VS Code Prettier
  extension can resolve the pinned local development dependency.

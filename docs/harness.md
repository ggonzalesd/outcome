# Agent harness map

`AGENTS.md` is the only agent rulebook. Code contracts, repeatable procedures, and architectural
decisions live in the documents it links.

## Lookup order

1. Root [AGENTS.md](../AGENTS.md).
2. [TypeScript/API conventions](conventions/typescript.md).
3. [Change triage](playbooks/change-triage.md) and the relevant playbook.
4. The relevant ADR, gotcha, and recent changelog entry.

Read the relevant slice; do not load unrelated reference-project workflows.

## Entry points

| Harness | Entry point | Behavior |
|---|---|---|
| Codex | `AGENTS.md` | Native shared manual |
| Claude Code | `CLAUDE.md` | Imports the shared manual |
| Gemini CLI | `GEMINI.md` | Imports the shared manual |
| Cursor | `.cursor/rules/agents.mdc` | Always-on shared-manual pointer |
| GitHub Copilot | `.github/copilot-instructions.md` | Shared-manual pointer and minimal inline rules |
| OpenCode | `opencode.json` | Loads manual, harness map, and stack conventions |

Run `make harness-check` after changing an entry point. The check verifies files and pointer
contents; it does not launch or validate the external agent applications themselves.

Ignore local `.codex/`, `.gemini/`, `.opencode/`, and Claude local settings. Do not place project
policy or credentials there. Harness entry points do not grant Git or installation permission.

# Playbook: Git workflow

Read-only `git status`, `diff`, `log`, `show`, and `blame` are always allowed. Every mutation requires
explicit maintainer authorization in the current conversation; that authorization persists across
turns. An explicit request to initialize Git is sufficient for init, but not for an initial commit,
remote creation, or push.

The default branch is `main`. When branch work is authorized, use `<type>/<scope>-<slug>` such as
`feat/result-error-mapping`. Do not create a branch merely to run read-only checks.

Before a commit, inspect status, review the complete proposed diff (including newly created files),
run `make verify`, and obtain approval for the concrete commit if not already authorized. Use a
Conventional Commit such as `feat(core): add Result and Option primitives`. Never add attribution
or co-author trailers.

Before configuring a remote or creating a GitHub repository, establish the owner, repository name,
and visibility. Before pushing or tagging, get explicit approval for the concrete revision and
destination. Release tags use `vMAJOR.MINOR.PATCH`; do not retarget published tags.

No workflow command or agent entry point overrides these rules. Never delete unrelated files,
reset user changes, or stage credentials and local agent state.

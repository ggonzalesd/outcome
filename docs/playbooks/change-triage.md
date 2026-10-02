# Playbook: triage a change

1. Identify whether the request is a regression, new behavior, refactor, tooling change, or analysis.
2. Read the public [contract](../conventions/typescript.md), relevant tests, and relevant ADR.
3. For a regression, use [bug fix](bug-fix.md). For an uncertain semantic choice, gather evidence
   before changing the contract and ask the maintainer when intent cannot be inferred.
4. A small change records its acceptance behavior, focused tests, verification, and changelog.
5. A public API or distribution change also records its contract, compatibility effects, and an ADR
   when it makes a durable architectural decision. Prepare a concrete proposal before seeking any
   permission that is actually required; do not invent extra approval gates for authorized work.
6. Finish with `make verify`, update the relevant documents, and report evidence and remaining limits.

Use the smallest process that preserves intent. Do not introduce a monorepo feature lifecycle for
a one-package change, and do not reinterpret a request for analysis as permission to implement.

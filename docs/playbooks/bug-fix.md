# Playbook: fix a regression

1. State the accepted behavior and a concrete failing example.
2. Add a focused regression test and confirm it fails for the identified reason.
3. Identify whether the fault is in runtime behavior, inference/narrowing, packaging, or tooling.
4. Fix the owning layer without widening the API unnecessarily.
5. Run the focused test, relevant compile-time contracts, and `make verify`.
6. Record cause, changed behavior, verification, and any new gotcha in a changelog.

When accepted behavior is unknown, route through [change triage](change-triage.md). Do not label a
semantic preference as a bug or hide dependency type errors with unchecked casts.

# Core cleanup with behavior preservation

Date: 2026-10-01

## Request and contract

Apply the maintenance cleanup identified in the previous analysis. Keep the maintainer-owned class
API, existing overloads, object identity behavior, and absence sentinels. Do not introduce a new
container design or change semantics for an unmeasured optimization.

## Changes

- Result.whenNone handles the outer failure and delegates its inner conversion to Option.asResult.
- Option uses local ValueOf, TupleValues, and RecordValues aliases for repeated mapped types.
- A module-local isPresent predicate centralizes nullable checks and narrows generic values without
  new casts. Of still retains its exact input sentinel.
- Arbitrary thrown-value identity assertions use one shared test helper.
- Equivalent Of and equality scenarios use table-driven cases; all original scenarios remain.
- Added four runtime cases for null/undefined transformation sentinels, callable error payloads, and
  exceptions from missing-value factories. They passed before and after changing the core.
- Expanded compile-time collection checks for arrays, empty tuples, union members, and readonly records.
- Added no dependencies or public methods and performed no Git mutations.

## Performance evidence

A temporary copy of the pre-cleanup source was compared with the current source using Bun 1.4.2.
The exploratory experiment used five warm-up batches of 20,000 operations, then nine paired rounds
of 200,000 operations per scenario, alternating measurement order and checking equal checksums.
Both versions ran in one process without controlled garbage collection or process isolation.

| Scenario | Before median (ms) | After median (ms) |
|---|---:|---:|
| Result.Ok | 4.925 | 5.053 |
| Option.Some | 2.661 | 2.870 |
| Option.Of | 2.694 | 2.763 |
| whenNone on presence | 5.260 | 5.696 |
| map on failure | 5.272 | 5.225 |
| map on absence | 2.709 | 2.768 |
| Result.Join | 6.946 | 7.299 |
| Result.Zip | 12.244 | 11.486 |

These local samples do not establish a speedup or performance neutrality: variation also appeared
in unchanged code paths, and some changed scenarios had higher medians. The cleanup is justified by
maintenance and type clarity. Instance reuse, singleton absence, async scheduling changes, and
different freezing policies remain separate work requiring stronger measurements and contract review.

Runtime reflection also confirmed unchanged static and prototype property names for both classes.
The temporary experiment is retained locally under `/tmp/outcome-cleanup-baseline-m0q611sb/`;
it is not shipped or run in CI.

## Validation

- Baseline `make verify`: passed with 183 runtime cases.
- Final `make verify`: passed documentation/harness checks, both strict compiler projects,
  186 unit cases and one packaged-consumer integration case (187 runtime cases total).
- `bun run test:coverage`: passed; 100% source function/line coverage, including the presence guard.
- `make pack-check`: passed; six package files, with test helpers excluded.
- `git diff --check`: passed. Source changes were also reviewed against the temporary snapshot,
  since the initial repository files remain untracked and Git has no commit baseline.
- No dependencies were installed and no Git metadata was changed. Hosted CI has not run.

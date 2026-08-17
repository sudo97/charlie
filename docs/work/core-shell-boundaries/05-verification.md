# 05 — Verification

Every line below is the output of a command run against this branch.

## Per-task red → green

| Task | Red                                                                                       | Green                                                           |
| ---- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| T1   | `depcruise` — 2 `core-purity` errors                                                      | 0 `core-purity`; 6 → 4 violations; 75 tests pass; `tsc` clean   |
| T2   | `depcruise` — `no-circular` + `not-to-unstable` on `git-log-reader → createGitLogEmitter` | both gone; 4 → 2 violations; 75 tests pass                      |
| T3   | `depcruise` — `not-to-unstable: core/hotspots.ts → core/revisions.ts`                     | gone; 2 → 1 violation; 75 tests pass                            |
| T4   | `eslint` — cognitive complexity 11 > 10                                                   | clean; highest score in the file now **3**; 75 tests pass       |
| T5   | `depcruise` — frontend SDP edge; `prettier` — `README.md`                                 | `✔ no dependency violations found`; `prettier --check .` clean |

## Full suite

```
$ npm run verify
> prettier --check .            Checking formatting... (clean)
> eslint . && tsc --noEmit      (clean)
> depcruise src                 ✔ no dependency violations found (66 modules, 138 dependencies cruised)
> jscpd src --mode strict       0 clones
> vitest run --coverage         15 files, 75 tests passed
                                All files | 100 | 97.34 | 100 | 100
> stryker run                   Final mutation score of 95.19 >= break threshold 95

VERIFY EXIT: 0
```

## The coverage trap the spec predicted

Branch coverage moved **up**, 97.32% → 97.34%, during T3. The spec called this out in advance as the signature of code silently leaving the measured scope, so the check was on file count, not percentage:

```
Core files in coverage report: 15
  src/core/architectural-groups.ts   src/core/group-hotspots.ts
  src/core/count-revisions.ts        src/core/hotspots.ts
  src/core/coupled-pairs.ts          src/core/revisions.ts
  src/core/coupling.ts               src/core/soc.ts
  src/core/file-ownership.ts         src/core/tree-data.ts
  src/core/filters.ts                src/core/visual-complexity.ts
  src/core/git-log.ts                src/core/word-count.ts
  src/core/group-git-log.ts
```

14 before, 15 after — `count-revisions.ts` added, nothing dropped. The rise is the denominator shifting, not tests disappearing.

## Per-file mutation during Build

Run on the touched Core files as the work landed, per §154, rather than waiting for CI:

```
$ npx stryker run --mutate "src/core/count-revisions.ts,src/core/filters.ts,src/core/group-git-log.ts,src/core/revisions.ts"

File                |  total | # killed | # survived
 count-revisions.ts | 100.00 |        8 |          0
 filters.ts         | 100.00 |       23 |          0
 group-git-log.ts   | 100.00 |       16 |          0
All files           | 100.00 |       47 |          0        (3 seconds)
```

No surviving mutants on anything this change touched. The 13 survivors in the full-Core run are all pre-existing, in `coupling.ts`, `visual-complexity.ts`, `file-ownership.ts`, `coupled-pairs.ts` and `hotspots.ts` — untouched files.

## Runtime verification

The test suite going green does not prove the CLI still works. §155 asks for the real thing.

Built the pre-change binary from `main` in a separate worktree and the post-change binary from this branch, then ran both against **the same repository**, so the git history and the files on disk were identical inputs:

```
$ git worktree add /tmp/charlie-base main
$ (base)  node dist/cli/cli/index.js /Users/illia/Projects/charlie   → 284909 bytes
$ (branch) node dist/cli/cli/index.js .                              → 284909 bytes

$ diff <(tr ',' '\n' < report-base.html) <(tr ',' '\n' < report-new.html)
(no output)
```

**Byte-identical.** The report's hotspots, coupling, ownership and word-cloud payloads are unchanged. This is the evidence for the binding behaviour claim in `03-spec.md`.

Both builds completed with exit 0, and the CLI ran end to end — reading source files, computing complexity, writing `charlie-report.html`.

## Scope contract outcome

| Task | Predicted files | Actual                                                           |
| ---- | --------------- | ---------------------------------------------------------------- |
| T1   | 4               | 2 — structural typing meant no call site needed editing          |
| T2   | 3               | 2 — the test imports `produceGitLog` directly, not `getLogItems` |
| T3   | 5               | 5                                                                |
| T4   | 1               | 1                                                                |
| T5   | 2               | 2                                                                |

Total code files changed: **10** against a predicted 16, halt threshold 25. No tripwire fired. No task needed more than one attempt to go green, so no re-planning was required.

## T6 — what the local suite could not see

The PR opened green locally and went red in CI:

```
> depcruise src
ERROR: Your node version (20.20.2) is not supported. dependency-cruiser
       follows the node.js release cycle and runs on these node versions:
       ^22||^24||>=26
```

Two of the three jobs passed — tests, coverage and mutation on the changed Core surface. Only the coupling job failed, and it failed by the tool refusing to start rather than by finding a violation.

Local node is **22.22.0**; the workflows pinned **20**. `npm run verify` therefore cannot catch this class of failure by construction. Workflows now pin 22; `package.json`'s `engines: >=18` is deliberately unchanged, since it constrains the published CLI rather than the dev toolchain.

This is a defect in the adoption commit surfaced by this PR, not a defect in the boundary work. Recorded as lesson 4.

## What was not verified

- `cli/index.ts` has no automated test, so the composition move is covered only by the runtime run above. That gap is on the deferred list in `03-spec.md`.
- The frontend is unchanged by this branch and remains untested.

# 04 — Plan and Budget

## How red–green works on a structural change

Nothing here adds behaviour, so there is no new behaviour to drive out with a new test. Writing tests that assert a module's import list would be testing the linter.

The red–green cycle still applies; the failing check is just a different instrument. For each task the **red** state is a named gate command failing on a named violation, and the **green** state is that command passing with the full test suite still green. Both are recorded in `05-verification.md`.

The existing 75 tests are the safety net for behaviour. No task may modify what a test asserts — only import paths and identifier names.

Token backstop for this run: **150k output tokens**, per `AGENTS.md`.

## T1 — the Core declares the shapes it needs

Scenario: S1.

| Item               | Value                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Spec scenarios     | 1                                                                                                     |
| Predicted files    | 4 — `core/filters.ts`, `core/group-git-log.ts`, `cli/git-log-reader.ts`, `tests/core/filters.test.ts` |
| Expected new tests | none — pure type-ownership move                                                                       |
| Open decisions     | 0                                                                                                     |
| Red                | `npx depcruise src` reports 2 `core-purity` errors                                                    |
| Green              | zero `core-purity` errors; 75 tests pass                                                              |

## T2 — composition moves to the composition root

Scenario: S2.

| Item               | Value                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Spec scenarios     | 1                                                                                                         |
| Predicted files    | 3 — `cli/git-log-reader.ts`, `cli/index.ts`, `tests/cli/git-log-reader.test.ts`                           |
| Expected new tests | none                                                                                                      |
| Open decisions     | 0                                                                                                         |
| Red                | `npx depcruise src` reports `no-circular` and `not-to-unstable` on `git-log-reader → createGitLogEmitter` |
| Green              | both gone; 75 tests pass                                                                                  |

Watch item: `getLogItems` is currently exported and called from `cli/index.ts:13`. Deleting it changes the module's public surface. Nothing outside `src/cli` uses it — confirmed before editing, not assumed.

## T3 — split the `Revisions` type from the code that builds it

Scenario: S3.

| Item               | Value                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Spec scenarios     | 1                                                                                                                                 |
| Predicted files    | 5 — `core/revisions.ts`, new `core/count-revisions.ts`, `core/hotspots.ts`, `cli/readHotspots.ts`, `tests/core/revisions.test.ts` |
| Expected new tests | none — the existing `revisions.test.ts` moves with the function it tests                                                          |
| Open decisions     | 0                                                                                                                                 |
| Red                | `npx depcruise src` reports `not-to-unstable: core/hotspots.ts → core/revisions.ts`                                               |
| Green              | gone; 75 tests pass; Core coverage and mutation unchanged                                                                         |

Highest-risk task for the coverage and mutation gates: it moves a tested Core function to a new file. Margins are 0.32 points on branch coverage and 0.19 on mutation. Verified per-file with `npm run mutation:file` before moving on.

## T4 — bring `produceGitLog` under the cognitive budget, and sweep the file

Scenarios: S4, plus the slop sweep §157 requires of any file being edited.

| Item               | Value                                               |
| ------------------ | --------------------------------------------------- |
| Spec scenarios     | 1                                                   |
| Predicted files    | 1 — `cli/git-log-reader.ts`                         |
| Expected new tests | none                                                |
| Open decisions     | 0                                                   |
| Red                | `npx eslint .` reports cognitive complexity 11 > 10 |
| Green              | clean; 75 tests pass                                |

Sweep list for this file, from `01-exploration.md`: delete lines 29, 31, 42, 58, 59 (commented-out debug), delete lines 30 and 63 (restatement), delete lines 17–18 (narration), keep lines 14–16 trimmed — the isomorphic-git constraint is a genuine _why_.

## T5 — scope the SDP rule, and format the README

Scenarios: S5, S6.

| Item               | Value                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Spec scenarios     | 2                                                                                                         |
| Predicted files    | 3 — `.dependency-cruiser.cjs`, `README.md`, `docs/work/.../02-decisions.md` already records the rationale |
| Expected new tests | none                                                                                                      |
| Open decisions     | 0                                                                                                         |
| Red                | `npx depcruise src` reports the frontend SDP edge; `npx prettier --check .` warns on `README.md`          |
| Green              | both clean                                                                                                |

Runs last, so that the SDP scope change cannot mask a violation T1–T3 was supposed to fix. If it ran first, `core` and `cli` would still be covered, but sequencing it last means every earlier green was measured under the stricter rule.

## T6 — pin CI to a node version the tooling supports

Scenario: S7. Added mid-flight, after CI failed on the opened PR.

| Item               | Value                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Spec scenarios     | 1                                                                                                    |
| Predicted files    | 2 — `.github/workflows/ci.yml`, `.github/workflows/nightly-mutation.yml`                             |
| Expected new tests | none                                                                                                 |
| Open decisions     | 0                                                                                                    |
| Red                | CI: `ERROR: Your node version (20.20.2) is not supported. dependency-cruiser ... ^22\|\|^24\|\|>=26` |
| Green              | all three CI jobs pass                                                                               |

This is a defect in the adoption commit, not in this change set, and it is here only because it blocks this PR from going green. `npm run verify` cannot catch it: it runs on the developer's node, which is 22.22.0 locally. Adding the task rather than editing the workflows quietly keeps the diff explainable.

## T7 — make the mutation job actually mutate

Scenario: S8. Added after T6, when the _passing_ mutation check was found to have run nothing.

| Item               | Value                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Spec scenarios     | 1                                                                                                                      |
| Predicted files    | 1 — `.github/workflows/ci.yml`                                                                                         |
| Expected new tests | none                                                                                                                   |
| Open decisions     | 0                                                                                                                      |
| Red                | CI job "Mutation on changed Core files" passes in 13s having logged `No Core files changed`, on a PR that changes four |
| Green              | the job lists the four files and mutates them                                                                          |

Second defect in the adoption commit, and a worse one than T6: T6 failed loudly, this reported success.

## Tripwires

Watched across all five tasks:

- **Diff shape** — predicted 16 files total. Halt at 25.
- **Red–green cycles** — with no new tests being written, any task needing more than about three attempts to go green means the design in `02-decisions.md` is wrong, not the implementation. Halt and re-plan rather than push through.
- **Token backstop** — 150k.

Halting means returning to phase 4 with what was learned, not pushing through.

## Order

T1 → T2 → T3 → T4 → T5. T1 and T2 both touch `git-log-reader.ts`, T4 rewrites part of it; doing the structural moves before the extraction keeps each diff readable.

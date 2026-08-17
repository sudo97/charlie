# 04 — Plan and Budget

The spec's predicted diff is roughly 13 files, well past the ~5-file scope contract. It is therefore split into four tasks, each within contract, each independently verifiable. Tasks land in order; nothing depends on a later task.

Open decisions carried into any task: **0**. Everything the spec left open was closed in `02-decisions.md`.

Token backstop: 150k output tokens per task (`AGENTS.md`).

---

## Task 0 — Stop the git log reader losing commits

Added mid-flight, after Task 1's verification found the defect (`05-verification.md`). The driver chose to fix it inside this branch rather than as a separate slice.

**Spec scenarios covered:** none directly. This is a correctness precondition: Scenarios 2, 4, 5 and 6 all assert on payload contents, and none of that evidence means anything while the input is nondeterministic.

**Predicted files touched: 6.** Over the ~5 guideline, and stated as such rather than split, because a smaller split would leave the Core importing from the Shell in the intermediate state.

| File                                   | Change                                                                              |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/core/parse-log.ts`                | Moved from `src/cli/parse-log.ts`. Already pure — imports only a Core type          |
| `src/tests/core/parse-log.test.ts`     | Moved from `src/tests/cli/`                                                         |
| `src/core/parse-git-log.ts`            | New. `parseGitLog(text, onMalformedLine): LogItem[]`                                |
| `src/tests/core/parse-git-log.test.ts` | New                                                                                 |
| `src/cli/git-log-reader.ts`            | `produceGitLog` accumulates chunks into a string and calls `parseGitLog` on close   |
| `src/tests/cli/git-log-reader.test.ts` | Fixture corrected to real git output: `\n\n` between commits, no trailing separator |

**Design.** The incremental buffer draining goes away entirely rather than getting patched. A `\n\n` separator is just an empty line, so a whole-text line walk needs no separator handling at all: header lines start a commit, non-empty non-header lines are file entries on the current commit, empty lines are skipped. Both defects become unrepresentable rather than fixed.

Accumulating the full text before parsing is not a behavioral regression — `produceGitLog` already resolved only on `close`, so nothing downstream ever consumed partial results.

`onMalformedLine` is the injected effect the Core declares in its own terms, replacing the `console.log(e)` swallow. Faithful to current behavior: a malformed _file entry_ is reported and skipped, while a malformed _header_ still throws.

**Expected new tests** (`parse-git-log.test.ts`):

- `parses every commit when separated by blank lines` — the case defect 1 lost
- `parses the last commit when there is no trailing separator` — the case defect 2 lost
- `parses a single commit with no separators at all`
- `returns an empty array for empty text`
- `attaches file entries to the commit that precedes them`
- `reports a malformed file entry and keeps going`
- `reports a file entry that appears before any commit header`
- `ignores blank lines anywhere`

**Runtime verification.** The ground-truth comparison that found the bug, re-run: `git log` with charlie's exact arguments versus `produceGitLog`, ten runs, on this repository and on `sirvoy-frontend-library`. Counts must match exactly and be identical across runs.

**Halt tripwire specific to this task.** Moving `parse-log.ts` into the Core subjects it to the 100% coverage and ≥95% mutation gates for the first time. If its existing tests fall short and closing the gap becomes its own body of work, stop and re-plan rather than absorbing it here.

---

## Task 1 — Flag parsing, and progress output moved to stderr

**Spec scenarios covered:** 1, 3, 8 (three — at the limit).

**Predicted files touched: 4**

| File                                | Change                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/core/parse-args.ts`            | New. `parseArgs(argv: string[]): { repositoryPath: string; json: boolean; all: boolean }` |
| `src/tests/core/parse-args.test.ts` | New                                                                                       |
| `src/cli/index.ts`                  | Use `parseArgs`; branch on `json`; print hotspots-only JSON for now                       |
| `src/cli/simple-file-reader.ts`     | `console.log` → `console.error` on line 14                                                |

**Expected new tests** (`parse-args.test.ts`):

- `defaults to '.' when no arguments are given`
- `takes the first non-flag argument as the repository path`
- `finds the path when it follows the flag`
- `finds the path when it precedes the flag`
- `reports json false when --json is absent`
- `reports all true only when --all is present`
- `ignores unknown flags`
- `treats a bare -- as a flag, not a path`

**Notes.** `parseArgs` returns the raw string; `path.resolve` stays in `index.ts`. The `--json` branch in this task emits `{ "hotspots": [...], "coupling": [] }` so the flag is end-to-end verifiable at runtime before the coupling work lands; `coupling` is filled in by Task 4. This is a deliberate walking skeleton, not a partial implementation left behind.

**Runtime verification.** `charlie --json`, `charlie --json .`, `charlie . --json`, and `charlie --json > /tmp/out.json` — the last must contain parseable JSON and nothing else. Plus `charlie` with no flags, asserting `charlie-report.html` is still produced.

---

## Task 2 — Move the coupling computation into the Core and share it with the frontend

**Spec scenarios covered:** 7 (one).

**Predicted files touched: 3**

| File                                       | Change                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `src/core/coupling-analysis.ts`            | New. `couplingAnalysis(logItems: LogItem[]): { soc: Soc[]; coupling: CouplingItem[] }`. Unbounded |
| `src/tests/core/coupling-analysis.test.ts` | New                                                                                               |
| `src/frontend/src/data-loader.ts`          | Replace the local `soc` / `coupledPairs` / `coupling` composition (lines 18–30) with one call     |

**Expected new tests** (`coupling-analysis.test.ts`):

- `returns soc entries ordered by score, highest first`
- `returns one coupling entry per soc entry`
- `lists both sides of a pair, once under each file`
- `returns empty arrays for an empty log`
- `returns empty arrays when no commit touches more than one file`

**Notes.** Returns `soc` as well as `coupling` because `data-loader.ts` exposes both fields. Deliberately unbounded — the HTML report must keep showing everything (Scenario 7), and this is the module the bounds are applied _to_, not _in_.

**Runtime verification.** `charlie` with no flags, open `charlie-report.html`, confirm the Coupling tab still populates and row expansion still works. This is the one task that can regress the existing report, and the frontend has no test coverage, so the browser check is the evidence.

---

## Task 3 — Extract the percentile arithmetic so both arrays can share it

**Spec scenarios covered:** 0. This is the enabling refactor for Task 4; it is carried by the structural requirements under Scenario 4 rather than by a behavioral scenario of its own. Called out explicitly because a task with no scenarios is normally a smell.

**Predicted files touched: 4**

| File                                | Change                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/core/percentile.ts`            | New. `topByScore<T>(data: T[], percentile: number, minKept: number, score: (item: T) => number): T[]` |
| `src/tests/core/percentile.test.ts` | New                                                                                                   |
| `src/core/soc.ts`                   | `socPercentile` delegates to `topByScore` with `minKept: 0`. Behavior-preserving                      |
| `src/tests/core/soc.test.ts`        | Adjust only if delegation changes an assertion. Expected: no change                                   |

**Expected new tests** (`percentile.test.ts`):

- `keeps the top fraction implied by the percentile`
- `orders results by score, highest first`
- `keeps at least minKept entries when the percentile would keep fewer`
- `keeps everything when the data is shorter than minKept`
- `keeps everything at percentile 0`
- `returns an empty array for empty data`
- `does not mutate its input`

**Notes.** Why this exists: Task 4 must apply the same arithmetic to `Hotspot[]` and `Soc[]`, and `npm run check:duplicates` runs jscpd in strict mode. One shared implementation instead of two near-identical ones.

`socPercentile`'s existing tests are the regression net for the delegation — they must pass untouched. If any of them needs editing, the refactor is not behavior-preserving and the task halts.

**Halt tripwire specific to this task:** any change required in `src/tests/core/soc.test.ts`.

---

## Task 4 — The bounded JSON payload

**Spec scenarios covered:** 2, 4, 5, 6 (four — one over the limit).

Scenarios 5 and 6 are each a single boundary of the same function (`--all` bypasses the bounds; empty input yields empty arrays) rather than independent behavior, so they are carried together. Flagged rather than hidden; if Build shows this was optimistic, the task splits at `jsonPayload` versus the CLI wiring.

**Predicted files touched: 4**

| File                                  | Change                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| `src/core/json-payload.ts`            | New. `jsonPayload(hotspots, analysis, limits)`, plus the default limits constant |
| `src/tests/core/json-payload.test.ts` | New                                                                              |
| `src/cli/index.ts`                    | Replace Task 1's hotspots-only payload with the real one                         |
| `README.md`                           | Document `--json` and `--all`                                                    |

**Expected new tests** (`json-payload.test.ts`):

- `emits exactly the hotspots and coupling keys`
- `bounds hotspots by complexity times revisions`
- `bounds coupling by soc score`
- `keeps at most maxCoupledFiles partners per file`
- `orders coupled files by percentage, highest first`
- `drops coupling entries whose file was filtered out of the soc set`
- `returns everything when limits are absent`
- `returns empty arrays for empty input`
- `does not mutate its inputs`

**Notes.** Takes the already-computed `analysis` rather than `logItems`, so it reuses Task 2's composition instead of re-deriving it. Serialization (`JSON.stringify(payload, null, 2)`) stays in the Shell — `jsonPayload` returns a plain object, which is what makes it assertable by deep equality.

`--all` is expressed as absent limits, not as a boolean threaded through the Core. One code path, two callers.

**README additions:** a `--json` section with a shape example, the three default limits with the measured token figures, and `--all` alongside the honest note that it produced 8.56 MB on a 518-file repository. Fix the stale claim that "coupling thresholds and percentile filters are available through the interactive frontend" while in that file.

**Runtime verification.** `charlie --json` on charlie itself and on `sirvoy-frontend-library`; assert the payload parses, matches the shape, and lands near the measured 9.9 KB and 53.5 KB. Then `charlie --json --all` on charlie, asserting the counts rise to the unbounded 14 hotspots and 16 coupling entries.

---

## Order and gates

1 → 2 → 3 → 4. After each task: `npm run lint`, the test suite, and `npm run mutation:file` on that task's new Core files. `npm run verify` in full once at Deliver.

Task 2 is the only one that can break existing behavior, so it gets the browser check. Tasks 1 and 4 are the only ones producing observable new output, so they get the CLI runs.

## Shared halt tripwires

- Any task's diff reaching 8 files.
- `check:deps` reporting a cycle, a Core-purity violation, or an SDP violation — that means the module boundaries in `02-decisions.md` are wrong, and it goes back to Challenge rather than getting patched.
- `check:duplicates` flagging the new Core modules against each other or against `data-loader.ts` — same reasoning.
- Task 3 requiring an edit to `src/tests/core/soc.test.ts`.
- 150k output tokens on any single task.

# 05 — Verification

## Correction: this branch started from a stale base

`01-exploration.md` was written against local `main` at `d9a0c0c`. That was not the tip: PR #3, "Fix the Core/Shell boundary violations CI surfaced" (branch `core-shell-boundaries`), had already merged to `origin/main` at `8c3c5b8` earlier the same day, and the local clone had not fetched it. The exploration was accurate about the code it read and wrong about which code was current.

This surfaced while running the gates. On the stale base:

```
lint:        1 error — cognitive complexity 11 > 10 at src/cli/git-log-reader.ts:28
check:deps:  6 violations, including
             no-circular:  src/cli/createGitLogEmitter.ts → git-log-reader.ts → createGitLogEmitter.ts
             core-purity:  src/core/filters.ts → src/cli/config.ts
             core-purity:  src/core/group-git-log.ts → src/cli/config.ts
```

Verified pre-existing by stashing this task's changes and re-running against `d9a0c0c` untouched. `npm run verify` could not have passed on that base — which is exactly what PR #3 had already fixed.

Nothing was committed at that point, so the branch was reset onto `origin/main` and the two Shell edits reapplied by hand. `src/cli/index.ts` was the only collision: PR #3 had moved the git-log composition into the composition root, replacing `getLogItems` with an inline `applyFilters(await produceGitLog(createGitLogEmitter(...)), config)`. The `--json` branch was reapplied around that.

Gates on the corrected base, before any of this task's changes:

```
lint:        clean
check:deps:  no dependency violations found (68 modules, 139 dependencies cruised)
```

**Consequences for the earlier artifacts.** Line references in `01-exploration.md` point at `d9a0c0c`. The two that moved: the `process.argv[2]` defect was at `src/cli/index.ts:9` and is at line 11 on the merged base, and `getLogItems` in `src/cli/git-log-reader.ts` no longer exists. Everything the exploration concluded still holds — no terminal output existed, `commander` is still an unused dependency, the coupling derivation still lives in the browser, and `console.log('reading', ...)` is still at `src/cli/simple-file-reader.ts:14`.

**A lesson, immediately.** `git fetch` before branching. The exploration phase ran `git log --oneline --all`, which _did_ list the nine unmerged commits, and they were read as belonging to an unmerged branch rather than as a signal that the local ref was behind. Running `git log` is not the same as running `git fetch` first.

---

## Task 1 — Flag parsing and progress output on stderr: complete

**Files touched: 4** (predicted 4).

| File                                | Change                                  |
| ----------------------------------- | --------------------------------------- |
| `src/core/parse-args.ts`            | New                                     |
| `src/tests/core/parse-args.test.ts` | New, 10 tests                           |
| `src/cli/index.ts`                  | `parseArgs` wiring, `--json` branch     |
| `src/cli/simple-file-reader.ts`     | Line 14 `console.log` → `console.error` |

### Red, then green

`npx vitest run src/tests/core/parse-args.test.ts` before implementation:

```
Error: Failed to load url ../../core/parse-args.js ... Does the file exist?
Test Files  1 failed (1)
```

After implementation:

```
✓ src/tests/core/parse-args.test.ts (10 tests) 2ms
Test Files  1 passed (1)
      Tests  10 passed (10)
```

### Mutation, per-file

`npm run mutation:file -- src/core/parse-args.ts`:

```
File           |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
 parse-args.ts | 100.00 |  100.00 |       11 |         0 |          0 |        0 |        0 |
Final mutation score of 100.00 is greater than or equal to break threshold 95
```

### Runtime evidence

Spec scenario 3 — all argument orders resolve to the same repository, and stdout carries only JSON:

```
1 --json:             JSON ok hotspots=14 coupling=0
2 --json .:           JSON ok hotspots=14 coupling=0
3 . --json:           JSON ok hotspots=14 coupling=0
4 --json --all:       JSON ok hotspots=14 coupling=0
5 --wat --json:       JSON ok hotspots=13 coupling=0     <- see note
6 --json <abs path>:  JSON ok hotspots=14 coupling=0
--- html file written by any --json run? ---
ls: charlie-report.html: No such file or directory
```

Scenario 2 — `charlie --json > /tmp/t1.json 2>/tmp/t1.err`:

```
parsed OK, hotspots: 14 coupling: 0 keys: hotspots,coupling
stderr lines:  14
reading /Users/illia/Projects/charlie/src/cli/git-log-reader.ts
```

Stdout is parseable JSON with no progress lines mixed in; all 14 progress lines went to stderr. Scenario 1 — a run with no flags still produced `charlie-report.html` (287,512 bytes) and printed the "Report generated successfully at" line.

Scenario 8 — `--wat` was ignored and the run proceeded.

**A false alarm worth recording.** An earlier version of the argument-order check looped over variants held in a shell variable and passed them unquoted. zsh does not word-split unquoted parameters, so `--json .` reached the process as a single argument `"--json ."`, which `parseArgs` correctly read as one unrecognized flag with no path. The apparent failure was in the test harness, not the code. Re-run with explicit arguments, everything passed.

**The `hotspots=13` in line 5 above is not a `--wat` effect.** It is the pre-existing defect described below, which was surfacing intermittently throughout this task.

---

## HALT — pre-existing data loss in the git log reader (resolved, see Task 0)

**Tripwire:** not a scope contract tripwire. This is the spec-is-binding rule (`DISCIPLINE.md`, phase 3): code and spec disagree, so work stops until one of them is fixed explicitly.

Work stopped here and the driver was asked how to proceed. The decision was to fix it inside this branch, which became Task 0 in `04-plan.md`. The diagnosis below stands as written; the fix and its evidence follow it.

### What was observed

While verifying Task 1, repeated identical invocations returned different data:

```
run: hotspots=13
run: hotspots=13
run: hotspots=13
run: hotspots=9
run: hotspots=14
run: hotspots=13
```

The file sets differed too, not just the counts — `colours.ts`, `filters.ts`, `App.tsx`, `group-git-log.ts` and `revisions.test.ts` each appeared in some runs and not others.

### It is not caused by this task's changes

`git stash --include-untracked`, rebuild, five runs of the unmodified `HEAD` code reading the hotspot payload out of `charlie-report.html`: `14, 14, 14, 14, 14`. That looked exonerating, but those runs sent stdout to `/dev/null` while the `--json` runs piped it, and the underlying fault is timing-sensitive. Isolating the analysis from all output settled it:

```
  3x  commits=11 files=16 hotspots=14
  9x  commits=12 files=16 hotspots=14
```

The log reader itself returns a varying number of commits. Nothing in this task touches it.

It also survives on the corrected base. Four argument-equivalent invocations of the rebased build returned `hotspots=14, 15, 15, 15`.

### Root cause

Two independent defects in `produceGitLog`, `src/cli/git-log-reader.ts`. PR #3 refactored this function — it extracted `appendLine`, which is what cleared the cognitive-complexity error — but the refactor was behavior-preserving and carried both defects across verbatim:

**1. Data past the second separator is discarded.** On the merged base:

```ts
const [completed, rest] = buffer.split('\n\n');
buffer = rest!;
```

When a chunk contains two or more `\n\n` separators, `split` returns three or more parts, but only two are destructured. Everything from the third element onward is dropped on the floor. The handler also processes at most one separator per `onData` call regardless of how many are buffered.

**2. The final buffer is never flushed.** `onClose` resolves with `logItems` without processing whatever remains in `buffer`. Verified against real output: `git log` with charlie's own arguments emits **13 commit headers and 12 `\n\n` separators, with no trailing separator** — so the last commit never has a terminator and is dropped whenever it is still buffered.

### Proof

Feeding `produceGitLog` a controlled emitter with three commits, varying only the chunk boundaries:

```
input: 3 commits (aaa, bbb, ccc)

A) all in one chunk        -> aaa           (lost bbb and ccc)
B) 3 chunks at separators  -> aaa,bbb       (lost ccc)
C) split byte-by-byte      -> aaa,bbb       (lost ccc)
```

Measured against ground truth on this repository, using charlie's exact git arguments and its own resolved `after` date. On the stale base:

```
git log says: 32 commits
produceGitLog over 10 runs: 2x 30, 8x 31
```

And on the merged base, confirming PR #3 did not fix it:

```
git log says: 35 commits
produceGitLog over 10 runs: 10x 34
```

One to two commits lost on every run, and which ones depends on how the OS happens to split the pipe.

PR #3's own `FIXME` on this function reaches the same conclusion independently: it records that `appendLine` and the buffer draining "are pure — text in, `LogItem[]` out — and belong in the Core", and that moving them "would put this parser under the Core's coverage and mutation thresholds, where it belongs." That note documents the missing test coverage as a boundary problem; what it does not say is that a live data-loss defect is sitting inside the untested code.

### Why the existing tests pass

`src/tests/cli/git-log-reader.test.ts` does randomize chunk sizes, so the intent was right. But its fixture joins the two commits with a single `\n` and appends one `\n\n` at the very end:

```ts
.join('\n') + '\n\n'
```

That input contains exactly one separator, positioned at the end — so it can never trigger defect 1, and it supplies the trailing terminator that real git output lacks, so it can never trigger defect 2. The test encodes an incorrect model of git's output format. This is discoverability debt: the fixture, not a document, is the thing to fix.

### Impact

Wider than this task. Every metric charlie produces — hotspots, revisions, SOC, coupling percentages, word count, ownership, truck factor — is computed from a log that is silently missing commits, in the HTML report as much as in the new JSON output. Corroborating evidence collected earlier without noticing it at the time: the sizing measurements in `02-decisions.md` recorded `commits=393` for `sirvoy-frontend-library` on one run and `commits=387` on another.

The numbers in `02-decisions.md` and `03-spec.md` are therefore approximate. They are the right order of magnitude and the bounding decisions they justify still hold, but they should be re-measured after a fix.

### Why this blocks the remaining tasks

Tasks 2 and 4 both carry runtime verification that asserts on payload contents and sizes. Against a nondeterministic input, that evidence is worthless. More directly, the feature exists so an agent can read charlie's data; data that changes between identical runs does not serve that purpose.

---

## Task 0 — Stop the git log reader losing commits: complete

**Files touched: 6** (predicted 6).

The incremental buffer draining was deleted rather than patched. A `\n\n` separator is just an empty line, so `parseGitLog` walks every line of the accumulated text: header lines start a commit, non-empty non-header lines are file entries on the current commit, blank lines are skipped. There is no separator handling left to get wrong. `produceGitLog` now only accumulates chunks and calls the Core function on `close`, which also removed the `appendLine` helper and its `FIXME`.

`parse-log.ts` moved to `src/core/`, so both it and `parse-git-log.ts` now sit under the Core's coverage and mutation gates — which is what PR #3's `FIXME` asked for.

### Red, then green

`parse-git-log.test.ts` before implementation: `Test Files 1 failed (1)`, no tests collected. After: 9 passed. Full suite 106 passed (17 files).

**One red was my own fixture's fault.** The malformed-file-entry test used `'not a file entry'`, which `parseFileEntry` splits on whitespace into four fields and accepts as `{ added: NaN, removed: NaN, fileName: 'file' }`. It is not malformed by that parser's standards. Replaced with a single-token line. Worth noting separately: `parseFileEntry` will happily return `NaN` counts for non-numeric input. Pre-existing, not in scope, recorded as a lesson candidate.

### The tripwire fired, and was cleared without re-planning

As predicted, moving `parse-log.ts` into the Core exposed it to gates it had never faced:

```
coverage:  parse-log.ts  95%   (lines 25-26 uncovered)
mutation:  parse-log.ts  67.44%  (14 survived)
           parse-git-log.ts 89.66%  (3 survived)
```

Judged bounded — one test file, no new production code — so it was absorbed rather than re-planned. Two of the survivors were genuine design feedback, not test gaps:

- **`parse-git-log.ts`'s `!current` guard was behaviorally redundant.** With the guard mutated to `if (false)`, `current.fileEntries.push` throws a `TypeError` that the surrounding `try/catch` converts into the same `onMalformedLine` call — identical observable behavior, so no test could kill it. Kept the guard for its clearer diagnostic and made the test assert the error message, which distinguishes the two paths.
- **`parseLogItem`'s `!firstLine` guard threw the same message `parseHeader` would.** `parseLogItem('')` and the mutated version both surfaced `Invalid log item`, so the mutant was unkillable by construction. Changed the guard's message to `Empty log item`, which both makes the mutant killable and improves the diagnostic.

The remaining 12 survivors in `parse-log.ts` were ordinary missing cases in tests inherited from before this discipline: each header field missing individually (which is what kills the `||`-chain `LogicalOperator` mutants), trailing-quote stripping versus an apostrophe inside an author or message, and `parseFileEntry`'s rejection paths and error message. Ten tests added.

Final:

```
File              |  total | covered | # killed | # timeout | # survived |
All files         | 100.00 |  100.00 |       71 |         1 |          0 |
 parse-git-log.ts | 100.00 |  100.00 |       29 |         0 |          0 |
 parse-log.ts     | 100.00 |  100.00 |       42 |         1 |          0 |
Final mutation score of 100.00 is greater than or equal to break threshold 95
```

### Runtime evidence: the parser now matches git exactly

`git log` with charlie's own arguments and resolved `after` date, versus `produceGitLog`, ten runs each:

```
PASS  charlie                    git=    34  parser=10x 34
PASS  sirvoy-frontend-library    git=   420  parser=10x 420
PASS  sirvoy-project             git= 18492  parser=10x 18492
```

Exact, and identical across runs. Before the fix, charlie returned 34 of 35 and `sirvoy-frontend-library` returned 393 or 387 against a true 420 — roughly **7% of its history was being discarded**.

End-to-end determinism of the new output, six runs, comparing both the count and a checksum over every file/complexity/revision triple:

```
  hotspots=21  checksum=799
  hotspots=21  checksum=799
  hotspots=21  checksum=799
  hotspots=21  checksum=799
  hotspots=21  checksum=799
  hotspots=21  checksum=799
```

**21 hotspots, where the same command returned 14 or 15 before the fix.** The recovered commits surface seven more files. This is the clearest statement of the defect's real impact: charlie was under-reporting this repository's hotspots by a third.

### A trap for the next person

`src/cli/git-log-reader.ts` imported `LogItem` via the `@core/*` alias, and adding `import { parseGitLog } from '@core/parse-git-log.js'` failed at runtime with `Cannot find package '@core/parse-git-log.js'`. The alias is declared in `tsconfig.json` `paths` and in `vite.config.ts` — neither of which applies to the CLI build or to vitest. It appeared to work only because the pre-existing import was `import type`, which is erased before resolution. Every other Shell-to-Core value import in the repo uses a relative path. Both imports in that file are now relative.

### Not carried further

`parseLogItem` in `src/core/parse-log.ts` has no production caller — only its own tests. It is now fully covered and mutation-clean, so it is not a gate problem, but it is dead code. Not deleted here; flagged as a lesson candidate.

---

## Tasks 2, 3 and 4: complete

**Task 2 — shared Core coupling computation.** `couplingAnalysis(logItems): { soc, coupling }` in `src/core/coupling-analysis.ts`, deliberately unbounded. `src/frontend/src/data-loader.ts` now calls it instead of composing `soc` / `coupledPairs` / `coupling` itself, and its `loadSoc` wrapper is gone. 7 tests, 100% mutation.

The runtime check was meant to be a browser render of the Coupling tab. That was not possible here, so the evidence is weaker than planned and is stated as such: the report builds (283 KB, 21 hotspots embedded), and the exact computation the browser runs was executed in Node against the log the report embeds —

```
  logItems=13 soc=33 coupling=33
  soc ordered desc: true
  coupling keys match soc: true
  every entry has partners: true
  sample: "src/frontend/src/coupling/coupling-row.tsx" soc=23 partners=22
  partner shape ok: true
```

A visual confirmation that the tab renders is still owed and is the one thing a reviewer should click.

**Task 3 — shared percentile arithmetic.** `src/core/percentile.ts` exports `topN(data, n, score)` and `topByScore(data, percentile, minKept, score)`. The tripwire — any edit to `src/tests/core/soc.test.ts` — did not fire during the task: `git diff --numstat` on that file reported 0 changed lines while all its tests passed, which is what makes the delegation demonstrably behavior-preserving.

`topN` came out of a refactor while green: `boundCoupling` was calling `topByScore` with `percentile: 0, minKept: data.length` purely to get a sort, which was obscure. Splitting the plain "n highest by score" operation out made both call sites read straight.

**Task 4 — the bounded payload.** `src/core/json-payload.ts` exports `jsonPayload(hotspots, analysis, limits)` and `defaultLimits`. `--all` is expressed as `limits: undefined`, so there is one code path rather than a boolean threaded through the Core. 9 tests, 100% mutation.

Measured against the spec's predictions:

```
charlie          default:  hotspots=21 coupling=30 maxPartners=10   38.4 KB  ~9,818 tok
charlie          --all:    hotspots=21 coupling=33 maxPartners=22   63.9 KB  ~16,359 tok
sirvoy-frontend  default:  hotspots=30 coupling=32 maxPartners=10   53.5 KB  ~13,697 tok
sirvoy-frontend  --all:    hotspots=518 coupling=629 maxPartners=355  8,766.9 KB  ~2,244,324 tok
```

`sirvoy-frontend-library` matches the spec exactly — 53.5 KB predicted and measured, 8.56 MB predicted and measured. **charlie's own figure does not: 38.4 KB against a predicted 9.9 KB.** That is the Task 0 fix showing up. The 9.9 KB was measured on a truncated log; with the dropped commits restored, charlie has 21 hotspots instead of 14 and 33 coupled files instead of 16. The prediction was not wrong about the arithmetic, it was computed from bad data — which is the whole reason Task 0 had to come first.

The `minKept: 30` floor is visibly doing its job on both repos: charlie has 33 SOC files and keeps 30, while the percentile alone would have kept 2.

Scenario 6 (a repository with no multi-file commits yields `coupling: []`) is covered by unit test rather than at runtime; constructing such a repository was not worth it.

---

## Deliver: restructuring forced by the Stable Dependency Principle

`npm run verify` failed at `check:deps` with three `not-to-unstable` violations that none of the per-task checks had caught, because instability is a whole-graph property and only the finished graph exhibits it:

```
error not-to-unstable: src/core/coupling.ts → src/core/soc.ts            17% → 22%
error not-to-unstable: src/core/coupling.ts → src/core/coupled-pairs.ts  17% → 20%
error not-to-unstable: src/cli/git-log-reader.ts → src/core/parse-git-log.ts  40% → 50%
```

None of the three edges was new. All three appeared because adding modules changed the afferent and efferent counts of existing ones: `coupling.ts` gained dependents and so became _more_ stable than its own dependencies, while `soc.ts` gained a dependency and became less so. Fixed structurally — loosening the rule would violate the ratchet.

1. **`parse-git-log.ts` merged into `parse-log.ts`.** As a separate module it had two efferent edges (`git-log` for the type, `parse-log` for the parsers) against one dependent, which is what made it less stable than the Shell file importing it. Merging removes the edge entirely, and the two modules existed for the same reason — parsing git log text — so this is the cohesive answer rather than a metric dodge.
2. **`socPercentile` deleted.** Its `soc.ts → percentile.ts` edge is what pushed `soc.ts` above `coupling.ts`. It had no production caller before this branch and none after, since `json-payload.ts` calls `topByScore` directly. Worth being explicit, because it touches a driver decision: the driver chose "reuse `socPercentile`" as the bounding mechanism, and the substance of that choice is honoured — the percentile arithmetic is shared through `percentile.ts` rather than duplicated — but the named wrapper itself is gone. Its two tests went with it, which is why the suite is 133 tests rather than 135.
3. **`coupling-analysis.ts` re-exports `CouplingItem` and `Soc`.** `json-payload.ts` and `data-loader.ts` now take those types from the façade instead of reaching past it into `coupling.ts`, which restores `coupling.ts`'s afferent count. This one is a genuine improvement independent of the metric: consumers of the analysis have no business importing its internals.

After all three: `no dependency violations found (74 modules, 153 dependencies cruised)`.

The merge also left `src/tests/core/parse-git-log.test.ts` named after a module that no longer existed, so its `parseGitLog` block was folded into `src/tests/core/parse-log.test.ts` (26 tests) during the slop sweep.

---

## A further defect found during the slop sweep, not fixed

The `FIXME` on `GitLogEmitter` says `onData` is typed `string` but receives a `Buffer`. Since `produceGitLog` now accumulates before parsing, it was worth checking whether the per-chunk `toString()` corrupts multi-byte characters. It does:

```
expected author: "Илья Михневич"
one Buffer:       "Илья Михневич"
split mid-char:   "��лья Михневич"
```

A UTF-8 character straddling a chunk boundary is destroyed. For a repository with non-ASCII author names this silently splits one author into two, corrupting ownership and truck-factor analysis.

**Not a regression** — the previous code had the identical `chunk.toString()` per chunk. **Not fixed here** — it is a third, distinct defect, and Task 0 already absorbed one unplanned fix. The current design makes the fix cheap for whoever takes it: accumulate `Buffer[]` and `Buffer.concat(...).toString('utf8')` once, which requires the `chunk: Buffer | string` type change the existing `FIXME` already describes and explains the cost of. Nominated in `06-lessons.md`.

---

## Task 5 — `coupling()` was quadratic

Added mid-flight after the driver challenged the claim that parsing a full history took 24 ms. The parse figure held up, but profiling the whole pipeline to defend it found something much worse.

### The parse claim, verified properly

The doubt was reasonable, so completeness was proved rather than asserted — every header line must become a commit and every numstat line a file entry:

|                               | 1-year window         | full history            |
| ----------------------------- | --------------------- | ----------------------- |
| Raw                           | 5.28 MB, 85,115 lines | 22.87 MB, 356,435 lines |
| Header lines → commits parsed | 18,492 → 18,492       | 50,184 → 50,184         |
| Numstat lines → fileEntries   | 53,254 → 53,254       | 267,083 → 267,083       |
| Lines reported malformed      | 0                     | 0                       |
| Parse                         | 22–30 ms              | 93–105 ms               |

4.3× the lines for 4.4× the time — linear, no accidental quadratic. ~3M lines/s is unremarkable for `split('\n')` plus `startsWith` and two `split`s per line. The 24 ms was real.

### What profiling actually found

`charlie --json` on `sirvoy-project`:

```
read config              1 ms
git log spawn+parse   9,768 ms
applyFilters              7 ms
readHotspots (I/O)      520 ms
couplingAnalysis     33,901 ms   <-- 77% of the run
jsonPayload              54 ms
JSON.stringify            2 ms
TOTAL                44,254 ms
```

Broken down: `soc()` 12 ms, `coupledPairs()` 2,373 ms, **`coupling()` 32,513 ms**. `coupling()` re-scanned the whole pairs array once per SOC file — 6,762 × 1,211,043 = 8.2 billion comparisons.

This is pre-existing code that this branch did not write, but the branch is what put it on the CLI path; before, only the browser ran it. So the HTML report has always stalled for ~30 s on a repository this size — `--json` made it visible and attributable.

### Fix: index the pairs once

`coupling()` now builds a `Map` from file to partners in a single pass. Output is byte-identical, verified on three repositories:

```
charlie                   pairs=      215    current      0 ms   indexed   0 ms   identical=true
sirvoy-frontend-library   pairs=   30,035    current    121 ms   indexed   3 ms   identical=true
sirvoy-project            pairs=1,211,043    current 30,372 ms   indexed 165 ms   identical=true
```

**184× faster.** One subtlety made the first attempt wrong: `sirvoy-project` contains exactly one pair with `file1 === file2` — a file listed twice in one commit's numstat. `coupling()`'s filter matched it once; a naive index keyed on both sides counted it twice, giving 53 partners where the original gave 52. The guard is `if (file2 !== file1)`, and the case is now pinned by a test with a comment explaining why it exists.

Four characterisation tests were added to `coupling.test.ts` _before_ the rewrite and passed against the old implementation, which is what makes them a regression net rather than a description of the new code.

### `coupledPairs()` — investigated, one change taken, one refused

The driver asked for this to be looked at in the same task.

**The input shape is the story.** On `sirvoy-project` the median commit touches 2 files, but:

```
files per commit: max=816  p99=36  median=2
total pair-occurrences implied: 1,751,905
commits with >200 files: 11  -> they alone imply 1,222,612 pair-occurrences (70%)
```

Eleven commits — bulk refactors or vendor drops — generate 70% of both the work and the output. A commit touching 816 files carries no information about logical coupling.

**Taken: allocation-free union sizing.** The final loop built a throwaway `Set` per pair to size a union. Replaced with `|A| + |B| − |A ∩ B|`. Measured on the 1.2M-pair repository: 950 ms → 502 ms, output identical.

**Refused: excluding large commits.** This is the change that would actually pay, and it is not safe:

| Max files/commit | Commits dropped | Pairs     | Time     | Reported files matching baseline |
| ---------------- | --------------- | --------- | -------- | -------------------------------- |
| ∞                | 0               | 1,211,043 | 2,470 ms | 339/339                          |
| 500              | 4               | 492,883   | 1,333 ms | 164/339                          |
| 200              | 11              | 279,236   | 898 ms   | 204/339                          |
| 100              | 37              | 152,098   | 489 ms   | 127/339                          |
| 50               | 72              | 97,975    | 371 ms   | 102/339                          |

At a 200-file limit, 135 of the 339 reported coupling files change — and the effect is **non-monotonic** (a 500-file limit matches the baseline _worse_ than a 200-file limit), because dropping different commits reshuffles the SOC ranking. That is an analysis-methodology decision affecting the HTML report as much as the JSON, not a performance knob. It needs its own spec.

### A mutation-testing trap worth knowing

The first version of `unionSize` walked the smaller set first. Mutation score for `coupled-pairs.ts` dropped to **89.55%**, with all three new survivors on `a.size <= b.size ? [a, b] : [b, a]`. Which set you walk cannot change the result, so those mutants are **equivalent by construction** — no behavioural test can ever kill them. The branch was measured at 406 ms versus 502 ms: 96 ms of a 13.8 s run, 0.7%, in exchange for three permanently unverifiable mutants. Removed, with a comment recording the trade so nobody re-adds it.

**And a CI trap behind it.** `coupled-pairs.ts` was already at **94.44% with 3 survivors on `origin/main`** — under the 95 break threshold. The full-Core run passes at 97.66% because stronger files carry the average, but the CI mutation job mutates _only changed Core files_, so merely touching this file would have failed CI on a pre-existing score. Removing the unobservable branch lifted it to 95.08%, which clears the gate.

The three survivors that remain are pre-existing and also provably equivalent. `normalize`'s only consumer is a sort comparator, and both arithmetic mutants rescale it by a positive constant — `(v−min)*(max−min)` is `correct × (max−min)²`, and `(v−min)/(max+min)` is `correct × (max−min)/(max+min)` — so the ordering is unchanged either way. The `max === min` mutant yields `0/0 = NaN`, and a NaN comparator also leaves order untouched. **`coupled-pairs.ts` cannot exceed 95.08% while `normalize` feeds only a comparator**, so the margin there is structural, not laziness. Nominated in `06-lessons.md`.

### Result

```
sirvoy-project           44,254 ms  ->  13,837 ms
  couplingAnalysis       33,901 ms  ->   2,719 ms
sirvoy-frontend-library                     338 ms total
```

`git log` is now 76% of the run and the dominant remaining cost.

---

## Gates: `npm run verify` in full

```
format:check       All matched files use Prettier code style!
lint               clean (eslint + tsc --noEmit)
check:deps         no dependency violations found (74 modules, 153 dependencies cruised)
check:duplicates   Found 0 clones
test:coverage      137 passed, Core statements/functions/lines 100%, branches 97.91%
mutation           97.66% over the whole Core (break threshold 95)
```

Per-file mutation on everything this branch created or changed:

| File                            | Score  | Survived |
| ------------------------------- | ------ | -------- |
| `src/core/parse-args.ts`        | 100.00 | 0        |
| `src/core/parse-log.ts`         | 100.00 | 0        |
| `src/core/percentile.ts`        | 100.00 | 0        |
| `src/core/json-payload.ts`      | 100.00 | 0        |
| `src/core/coupling-analysis.ts` | 100.00 | 0        |
| `src/core/soc.ts`               | 100.00 | 0        |
| `src/core/coupling.ts`          | 100.00 | 0        |

The 10 surviving mutants in the full-Core run are `coupled-pairs.ts` (3, pre-existing and provably equivalent — see Task 5), `visual-complexity.ts` (4), `file-ownership.ts` (2) and `hotspots.ts` (1), the last three in files this branch did not touch.

## Slop sweep

Zero comment lines in every new or changed Core file, so no section or narration comments to remove. The only `console.*` additions in the diff are the two intended stdout writes in `src/cli/index.ts`. `produceGitLog`'s `FIXME` about `appendLine` belonging in the Core was deleted because the move happened; the `FIXME` about `onData`'s type remains and is now backed by the reproduction above.

## Status

All six tasks complete. `npm run verify` green.

Owed to the reviewer: a browser check of the Coupling tab (Task 2), and a decision on the UTF-8 defect nominated in `06-lessons.md`.

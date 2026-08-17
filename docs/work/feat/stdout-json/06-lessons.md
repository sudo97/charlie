# 06 — Lessons

Nominations for a human to accept or discard before this folder is erased. The bar: would you tell this to the next agent before it starts, and would it change what they do?

## 1. Charlie's git log parser was dropping commits, and every metric was wrong

**What.** `produceGitLog` lost one to two commits on this repository and roughly 7% of history on a 518-file one — nondeterministically, depending on how the OS split the pipe. Two causes: `buffer.split('\n\n')` destructured only two elements and discarded the rest, and `onClose` never flushed the trailing buffer, while `git log --pretty=format:` emits no trailing separator. Fixed in Task 0.

**Why it might outlive the PR.** Every number Charlie has ever produced — including in the HTML report, including any analysis anyone acted on — was computed from a truncated log. On this repository the hotspot count went from 14 to 21 once the fix landed. Anyone who has used Charlie's output to make a decision should know it was under-reporting.

**Where it would live.** The regression net is already in the code: `src/tests/core/parse-log.test.ts` now covers multi-separator input and a missing trailing separator, and `src/tests/cli/git-log-reader.test.ts` has a three-commit fixture in the real format. That is the right home — a test, not a document. What may deserve a line in the README or a release note is the fact that **prior output was wrong**, because no test can tell a user that.

## 2. A test fixture that encodes the wrong input format is worse than no test

**What.** `git-log-reader.test.ts` already randomised chunk sizes — the author was actively thinking about streaming boundaries. But its fixture joined commits with a single `\n` and appended one `\n\n` at the end, so the input had exactly one separator, at the end. That is structurally incapable of triggering either defect. The test passed for years and read as coverage.

**Why.** This is the general trap, not a Charlie quirk: a fixture is a claim about the shape of real input, and nobody reviews it as such. The randomised chunking made it look _more_ rigorous than it was.

**Where it would live.** Worth a line in `DISCIPLINE.md` near the mutation-testing rules: when a test double stands in for an external format, verify the fixture against the real thing once, and say in a comment that you did. The corrected fixture now carries exactly that comment.

## 3. Whole-graph metrics cannot be checked per task

**What.** All four tasks passed `check:deps` individually. `npm run verify` at Deliver then produced three Stable Dependency Principle violations, on edges that already existed and were untouched. Instability is `Ce / (Ca + Ce)`, so adding a module changes the ratings of modules it merely imports: `coupling.ts` acquired dependents and became _more_ stable than its own dependencies, which is a violation.

**Why.** The obvious reaction to an SDP failure on an untouched edge is to assume the rule is wrong and widen its scope. That would have been a ratchet violation, and the fixes turned out to be real improvements — merging two modules that existed for the same reason, deleting dead code, and stopping consumers reaching past a façade into its internals.

**Where it would live.** A line in `AGENTS.md`: run `check:deps` at the end of a multi-task branch, not only per task, and expect graph-wide gates to fail late. Anyone who hits this and reaches for the config first will make the codebase worse.

## 4. `git fetch` before branching, and read `git log --all` as a warning

**What.** This branch was cut from a local `main` that was one merged PR behind. The exploration phase read real code and drew accurate conclusions about the wrong revision, and reported `check:deps` as passing when it had six violations on that stale base — all already fixed on `origin/main`.

**Why.** The signal was right there: exploration ran `git log --oneline --all` and listed nine unmerged commits. They were interpreted as somebody's open branch rather than as "your ref is behind". A trap the next agent would plausibly repeat.

**Where it would live.** One line in `AGENTS.md` under the pipeline's Explore phase: `git fetch` first, then branch. Cheap to state, and it invalidated a phase of work here.

## 5. UTF-8 corruption at chunk boundaries — measured, then deliberately deferred

**What.** `produceGitLog` calls `chunk.toString()` per chunk, so a multi-byte character straddling a 64 KB boundary is destroyed. Reproduced:

```
expected author: "Илья Михневич"
one Buffer:       "Илья Михневич"
split mid-char:   "��лья Михневич"
```

For a repository with non-ASCII author names this splits one person into two, corrupting ownership and truck-factor output.

**Quantified, after the driver questioned whether it was worth acting on.** It is real but rare. `sirvoy-project` is the worst case available — 4 of 81 authors and 684 commit subjects contain non-ASCII:

| Measure                        | Value            |
| ------------------------------ | ---------------- |
| Log size, full history         | 22,626,236 bytes |
| Multi-byte characters          | 1,046            |
| Continuation bytes             | 1,157 (0.0051%)  |
| 64 KB chunk boundaries per run | 345              |
| Expected corruptions per run   | 0.018            |
| P(at least one) per run        | 1.7%             |
| Observed across 10 real runs   | 0                |

So roughly one run in sixty mangles a single author string or commit subject, producing a phantom contributor with one commit. Not the systematic, every-run loss that lesson 1 describes. `charlie` and eleven of the twelve other local repositories have no non-ASCII authors at all.

**The performance objection does not apply.** The driver's concern was that accumulating the whole log would be slow to parse. Measured: parsing a 5.28 MB / 18,492-commit log takes 24 ms of a 9,902 ms run — `git log` itself is the cost, and parsing is 0.24% of it. The fix adds ~8 ms on a 22.6 MB log (7.8 ms for per-chunk `toString` versus 15.4 ms for `Buffer.concat(...).toString('utf8')`). Cost is not the obstacle in either direction, so deferring does not make the fix harder later.

**Decision: deferred.** Recorded here as a known, measured limitation rather than an open question.

**Where it lives now.** In the code. The `FIXME` on `GitLogEmitter` in `src/cli/git-log-reader.ts` previously read as a cosmetic type-tidiness note, which is why it sat there through PR #3; it now states that the type lie causes data corruption and carries these numbers, so the next person inherits the measurement instead of re-deriving it.

## 6. `coupling()` was quadratic, and the HTML report has always been the victim

**What.** `coupling()` re-scanned the whole pairs array once per SOC file: 6,762 × 1,211,043 = 8.2 billion comparisons, **32.5 s** on `sirvoy-project`. Indexing the pairs into a `Map` in one pass made it 165 ms — 184× — with byte-identical output on three repositories. Fixed in Task 5.

**Why it might outlive the PR.** This branch did not write that code; it only put it on the CLI path. Before, `src/frontend/src/data-loader.ts` was the only caller, which means **the HTML report has always stalled for ~30 s on load for a repository this size, in the browser, with no progress indication.** Anyone who tried Charlie on a large repo and concluded it hung was right, and the cause was never diagnosed because nothing surfaced it.

**Where it would live.** The fix is in the code and the characterisation tests are in `coupling.test.ts`. What might deserve a release note is that large-repo report load was broken and now is not.

## 7. Eleven commits generate 70% of the coupling analysis

**What.** On `sirvoy-project` the median commit touches 2 files, but 11 commits touch more than 200 (max 816) and those alone imply 1,222,612 of the 1,751,905 pair-occurrences. Bulk refactors and vendor drops dominate both the cost and the output, while saying nothing about logical coupling.

**Why it needs a human.** Excluding them is tempting and unsafe. Measured at a 200-file limit: pairs drop 1,211,043 → 279,236 and time 2,470 → 898 ms, but **135 of the 339 reported coupling files change**, and non-monotonically — a 500-file limit matches the unfiltered baseline _worse_ (164/339) than a 200-file limit (204/339), because dropping different commits reshuffles SOC rankings. It changes the answer, in the HTML report as much as in `--json`.

**Where it would live.** Its own pipeline slice with its own spec, most likely as a `.charlie.config.json` option (`maxFilesPerCommit`) so the choice is the user's and visible. Tornhill discusses excluding large commits, so there is prior art to check against — but it is a methodology decision, not an optimisation.

## 8. Equivalent mutants, and a CI gate that punishes touching a weak file

**What.** Two distinct traps hit in one task.

First: `unionSize` originally walked the smaller set first. That dropped `coupled-pairs.ts` to 89.55%, with all three new survivors on `a.size <= b.size ? [a, b] : [b, a]` — a branch that by construction cannot change the result, so no behavioural test can kill it. Measured worth: 96 ms of a 13.8 s run. Removed, with a comment recording the trade.

Second, and more important: **`coupled-pairs.ts` was already at 94.44% on `origin/main`, below the 95 break threshold.** The full-Core run passes at 97.66% because stronger files carry the average, but `.github/workflows/ci.yml` mutates _only changed Core files_ — so touching a weak file makes CI fail on a score that predates the change. Removing the unobservable branch lifted it to 95.08%, which clears the gate, but the trap is general and will catch the next person.

**Why.** Both are non-obvious and both cost real time here. The second one especially: an agent that improves a file and sees CI go red will assume it broke something.

**Where it would live.** A line in `AGENTS.md`: before touching a Core file, run `npm run mutation:file` on it first to learn its standalone score, because CI will judge it alone. And a note that a mutant which cannot change observable output is a signal to delete the code, not to write a cleverer test — the three survivors still in `coupled-pairs.ts` are of exactly that kind, since `normalize` feeds only a sort comparator and both arithmetic mutants rescale it by a positive constant. That file cannot exceed 95.08% as currently structured.

## 9. Bounding by percentile behaves like a fixed top-N, and grows the wrong way

**What.** The chosen bounds are percentile 0.95 with a floor of 30. Measured, the floor does all the work: on a 518-file repository, moving the percentile from 0.95 to 0.99 changed the payload from 53.5 KB to 50.4 KB, and on charlie the percentile alone would keep 2 of 33 files. Above roughly 600 files the percentile starts to govern, and then it _grows_ the output as the repository grows — a 5000-file monorepo would retain ~250 entries, on the order of 110,000 tokens.

**Why.** This is a decision with a long shadow: it is the one place where the design does the opposite of what a token budget wants, and the rationale will not be recoverable from the code. It was chosen deliberately by the driver over a fixed top-N, twice, and it does put previously-dead Core code to work.

**Where it would live.** Nowhere yet — it is already stated in the README's Limits table in user terms. Revisit the first time Charlie is pointed at a monorepo. Recorded here so the choice is not mistaken for an oversight.

## Not nominated

Deliberately left out, having been fixed in the diff instead of written down:

- The `@core/*` alias silently works for `import type` and fails for value imports in the CLI build. Both imports in the affected file are now relative, matching every other Shell-to-Core import in the repo. Nothing to say that the code does not now show.
- `parseFileEntry` accepts `'not a file entry'` as `{ added: NaN, removed: NaN, fileName: 'file' }`. Real, but it has never mattered because git's `--numstat` output does not look like that, and inventing validation for it is scope with no driver behind it.
- `charlie-report.html` is written to the repository root and is not in `.gitignore`. A one-line fix for whoever wants it; not worth a lesson.
- `parseLogItem` in `src/core/parse-log.ts` still has no production caller. Now fully covered and mutation-clean, so it costs nothing but is dead. Delete it or use it.
- zsh does not word-split unquoted parameters, which produced a false failure in a verification script. A fact about zsh, not about this codebase.

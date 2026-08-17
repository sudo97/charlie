# 02 — Decisions

## What the driver already decided

At the exploration gate, three choices were made:

1. **Scope:** hotspots + coupling. Word count and ownership are out.
2. **Format:** JSON only. No ASCII table.
3. **HTML:** terminal output _replaces_ the HTML report; it is not additive.

Everything below either follows from those or is a decision this document makes so that no open questions enter the plan.

## Proposed approach

Add a `--json` flag. When present, `charlie` computes hotspots and coupling, writes a single JSON document to stdout, and exits without touching the template, the frontend bundle, or the filesystem. Without the flag, behavior is byte-for-byte what it is today.

## Arguing against it

### "Can we not do the flag at all — just always print JSON?"

Rejected. It would break every existing user and the `charlie` command documented in the README. The flag is the minimum viable seam.

### "Can we not do coupling this round — hotspots only?"

This was offered at the exploration gate and the driver chose to include coupling. Keeping it. It is also the more valuable half: hotspots are guessable from `git log` one-liners, whereas coupling is the thing you cannot get without this tool.

### "Can we not introduce a new Core module — just inline it in `index.ts`?"

Rejected. Inlining puts the payload decision in the Shell, where mutation testing does not apply, and `index.ts` is a top-level-await script with no exported function, so it is not testable at all. The composition is a decision (which analyses, which keys, what order); the Core owns decisions.

### "Can we not hand-roll argument parsing — `commander` is already a dependency?"

**Decision: hand-roll a pure Core parser.** This is the closest call in the task.

For `commander`: mature, already in `package.json`, gives `--help` and `--version` for free.

Against, and this is what decides it: `commander` would live in `src/cli/**`, so the parsing decision lands in the Shell where the mutation and coverage gates do not reach. It also brings behavior CI cannot check — help text, unknown-flag handling, its own `process.exit` calls. Against a surface of exactly one optional flag and one optional positional, a ~10-line pure function `parseArgs(argv: string[]): { repositoryPath: string; json: boolean }` in the Core is smaller, gets the full 100%/≥95% test bar, and is trivially exhaustible: no args, path only, flag only, both orders, unknown flag.

`DISCIPLINE.md` line 49: "Favor the simplest wiring that works... Don't introduce a DI framework — a new tool to learn, a hidden dependency graph — where plain arguments would do." The same logic applies to an arg-parsing framework. And per exploration, `commander` is imported nowhere, so choosing against it breaks no precedent — it is a dependency that was never adopted.

Revisit if the flag count reaches ~4. Recorded as a lesson candidate.

The parser returns the _raw_ path string; `path.resolve` stays in the Shell, because `path` is Node I/O and the Core may not import it.

### The `reading <path>` lines are a blocker, and there is only one honest fix

`src/cli/simple-file-reader.ts:14` writes `console.log('reading', filepath)` — 14 lines on this repo, hundreds on a real one (exploration, measured). Stdout JSON is unparseable with these interleaved.

Options:

- **(a) Suppress it only in JSON mode.** Requires threading a "quiet" flag from the arg parser down through `readHotspots` into `simple-file-reader`. Three files touched to carry a boolean, and the Core's `visualComplexity` sits in the middle of that path. Rejected: it makes an unrelated Core signature depend on an output mode.
- **(b) Move it to stderr.** `console.error` instead of `console.log`. One-character-class change, one line. Progress output on stderr is the correct stream for progress output by convention — that is what stderr is for. Human users still see it exactly as before when running in a terminal, because both streams render to the tty. `charlie --json > data.json` yields clean JSON and still shows progress. `charlie --json 2>/dev/null` silences it.
- **(c) Delete it.** Loses progress feedback on large repos, where the run takes a while and the lines are the only sign of life.

**Decision: (b), move to stderr.** It is the smallest change, it fixes the problem for every future output mode rather than just this one, and it is arguably a latent bug being corrected rather than a feature being added. Note honestly: this changes observable behavior for anyone currently piping `charlie`'s stdout to a file and reading the progress there. That is not a documented use, and the lines say "reading", not data.

### Pretty-printed or compact JSON?

Decided rather than left open: **2-space indented**, `JSON.stringify(payload, null, 2)`.

The stated purpose is _seeing the data in a terminal_. A whole repo's hotspots and coupling as one unwrapped line fails that outright. Compact is cheaper in tokens for an AI reader, which is a real cost, but `charlie --json | jq -c .` is a one-command escape hatch and `jq` is close to universal, whereas there is no equally cheap way to make compact output readable. Optimize the default for the stated use, leave the other case to a pipe. No flag for it — a flag here is scope for a preference.

### Payload shape

```json
{
  "hotspots": [{ "file": "...", "complexity": 0, "revisions": 0 }],
  "coupling": [
    {
      "file": "...",
      "soc": 0,
      "coupledFiles": [{ "file": "...", "percentage": 0, "revisions": 0 }]
    }
  ]
}
```

Two top-level keys, values passed through from the existing Core types with no reshaping. Rejected additions: repository path, generation timestamp, tool version, config echo. Each is guessable or already known by whoever ran the command, and a timestamp would make the output non-deterministic and therefore untestable by equality.

An object rather than a bare array, so a third analysis can be added later without a breaking change.

### Where does the derivation live, and what about the frontend duplicate?

The new Core module composes `coupling(coupledPairs(logItems), soc(logItems))`. `src/frontend/src/data-loader.ts:18-30` already does exactly this in the browser.

The tempting move is to refactor `data-loader.ts` to call the new Core function, killing the duplicate. **Not this round.** It pulls the frontend into a task that is otherwise CLI-only, and the frontend has its own `@core/*` import aliasing and no test coverage to catch a regression. Deferred to `03-spec.md` Out of Scope, and raised as a lesson candidate so it is not silently lost. If `npm run check:duplicates` flags the two sites, that changes the calculus and the refactor comes back into scope — the three shared lines are below jscpd's strict-mode threshold on the current config, but this will be verified, not assumed.

## Dependency direction

New Core modules depend only on existing Core modules and their types. `src/cli/index.ts` (Shell, maximally unstable — nothing imports it) gains a dependency on the new Core module. Arrows point Shell → Core, which is the required direction. `npm run check:deps` is the referee, not this paragraph.

## Gate outcome

The driver approved decisions 1–5 and answered the two open items:

- **Progress on stderr:** approved.
- **Put the computation in the Core and reuse it in both the frontend and the JSON output:** approved, and the frontend gets wired to it _this round_. This supersedes the "leave `data-loader.ts` alone" position argued above — the duplicate is removed rather than deferred, so the jscpd contingency is moot.
- **Hand-rolled arg parsing:** approved. "No need for complex tool yet."
- **2-space indentation:** approved.
- **Payload shape:** approved. The driver's reading — "the same list of files by SOC as a key and their paired friends as values" — is exactly right, verified: `coupling()` maps over `soc()`'s output, which `src/core/soc.ts:20-22` returns sorted SOC-descending, and measured `emptyCoupledFiles: 0` on both test repos.
- **`.charlie.config.json` output-format setting:** raised by the driver, then withdrawn — "let's keep charlie-config out of it, I will take care of it later." Out of scope.

## Output size: the decision the measurements forced

The payload shape agreed above was measured before being specced, on two real repositories.

| Repo                    | Commits | Files | Pairs  | Pretty JSON | ~Tokens        |
| ----------------------- | ------- | ----- | ------ | ----------- | -------------- |
| charlie                 | 12      | 14    | 26     | 10 KB       | 2,500          |
| sirvoy-frontend-library | 393     | 518   | 30,035 | **8.56 MB** | **~2,245,000** |

`coupledPairs` (`src/core/coupled-pairs.ts:28`) applies no filtering: it emits every pair from every multi-file commit, so pair count grows as O(files-per-commit²) summed over history. 37× the files produced 1150× the pairs. `coupling()` then lists each pair twice, once under each participant (60,070 edges from 30,035 pairs). Two million tokens defeats the entire stated purpose of the task.

The driver chose to bound it by reusing `socPercentile` (`src/core/soc.ts:25`) — exported, tested, and called from nowhere in the codebase today. Measured at several percentiles:

| Percentile | Files kept | Max partners on one file | Size    | ~Tokens   |
| ---------- | ---------- | ------------------------ | ------- | --------- |
| 0 (none)   | 629        | 355                      | 8.56 MB | 2,244,000 |
| 0.9        | 63         | 355                      | 2.38 MB | 610,000   |
| 0.95       | 32         | 355                      | 1.41 MB | 361,000   |
| 0.99       | 7          | 355                      | 0.38 MB | 97,000    |

**`socPercentile` alone is not sufficient, and the measurement says why:** `maxPartnersOneFile` is 355 at every percentile. The files that survive a SOC filter are, by construction, the most-coupled ones — so filtering files does almost nothing to the term that actually explodes. At the other end it over-prunes: on charlie, 0.9 keeps 2 files and 0.95 keeps 1.

Therefore percentile selection is paired with two more bounds. Measured combinations:

| Bounds                         | mid repo                                  | charlie |
| ------------------------------ | ----------------------------------------- | ------- |
| pct 0.95, top 10 partners      | 110.9 KB / ~28,000 tok                    | 2.2 KB  |
| pct 0.95, min percentage ≥ 0.5 | 89.3 KB / ~23,000 tok (max 23 partners)   | 2.2 KB  |
| pct 0.90, top 10 partners      | 157.6 KB / ~40,000 tok                    | 3.0 KB  |
| pct 0.90, min percentage ≥ 0.3 | 369.9 KB / ~95,000 tok (max 151 partners) | 2.3 KB  |

**Decision: top-M partners by percentage, not a minimum-percentage threshold.** The threshold is more semantically appealing but its output size is unpredictable — at 0.3 it still left 151 partners on a single file. A slice gives a hard ceiling.

**Decision: a floor on files kept.** Percentile alone reduces charlie to 1–2 files, which makes the feature useless on small and young repositories — precisely the repositories someone tries a new tool on. Keeping `max(percentile result, minFiles)` costs one expression and fixes it: charlie keeps all 15, the mid repo is unaffected (63 > 30).

**Decision: defaults are `socPercentile: 0.95`, `minFiles: 30`, `maxCoupledFiles: 10`** — measured at ~28,000 tokens on the mid repo and ~2,500 on charlie.

**Decision: one `--all` flag bypasses every bound.** Silently discarding data with no way to ask for it back is dishonest, and the parser is hand-rolled anyway so a second boolean is nearly free. The README documents that `--all` produced 8.56 MB on a 518-file repo.

`hotspots` is left unbounded. Measured at 55.7 KB / ~14,000 tokens for 518 files — 110 bytes per file, growing linearly, not quadratically. Bounding it would require inventing a significance filter that does not exist in the Core, and `.charlie.config.json`'s `include` / `exclude` is the existing lever for a large monorepo. Recorded in the spec's Out of Scope and as a lesson candidate.

## Module boundaries, revised for frontend reuse

Because the frontend now shares the computation, and because the frontend must stay **unbounded** (it renders collapsed rows and can afford everything, and narrowing what the HTML report shows was never asked for), the split is:

- `core/coupling-analysis.ts` — `couplingAnalysis(logItems): { soc, coupling }`. Unbounded. The single source of truth, consumed by both `src/frontend/src/data-loader.ts` and the CLI. Returns `soc` as well as `coupling` because `data-loader.ts` exposes both.
- `core/json-payload.ts` — `jsonPayload(hotspots, analysis, limits)`. Applies `socPercentile` to `analysis.soc`, keeps only those files from `analysis.coupling`, caps each file's `coupledFiles`. Taking `analysis` rather than `logItems` is what lets it call `socPercentile` for real instead of re-deriving the wiring — no duplicated composition, so nothing for jscpd to find.
- `core/parse-args.ts` — `parseArgs(argv): { repositoryPath, json, all }`. Returns the raw path string; `path.resolve` stays in the Shell because `path` is Node I/O.

This is ~9 files, well past the ~5 predicted. It is split into three tasks in `04-plan.md` rather than run as one.

## Rejected wholesale

- ASCII table rendering — cut by the driver, and it is the expensive half (column widths, truncation, unicode width).
- Word count and ownership output — cut by the driver.
- `--top N`, `--sort`, threshold flags. `.charlie.config.json` already has `include` / `exclude` / `after`; `jq` covers the rest.
- Writing JSON to a file. Stdout is the whole point; `>` exists.
- Adding `charlie-report.html` to `.gitignore`. Real finding from exploration, unrelated to this task.

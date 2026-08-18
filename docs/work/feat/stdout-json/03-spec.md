# 03 — Spec

Charlie gains a way to print its analysis to the terminal as JSON, so that a person — or an AI agent running the command itself — can read the data without opening a browser.

## Behavior

### Scenario 1 — no flags, nothing changes

**Given** a repository
**When** `charlie` or `charlie /path/to/repo` is run
**Then** an HTML report is written to `<repo>/charlie-report.html` and the path is printed, exactly as today.

The only observable difference from current behavior: the per-file `reading <path>` progress lines go to stderr instead of stdout. In a terminal they look identical, because both streams render to the tty.

### Scenario 2 — `--json` prints the analysis and writes nothing

**Given** a repository
**When** `charlie --json` is run
**Then** a single JSON document is printed to stdout, 2-space indented, and no file is created or modified.

The template, the frontend bundle, and `charlie-report.html` are not touched. The "Report generated successfully at: ..." line is not printed. Exit code is 0.

Progress output continues to go to stderr, so `charlie --json > data.json` yields a file containing only JSON, and `charlie --json 2>/dev/null` is silent apart from the JSON.

The document has exactly two keys:

```json
{
  "hotspots": [{ "file": "src/core/soc.ts", "complexity": 42, "revisions": 7 }],
  "coupling": [
    {
      "file": "src/core/soc.ts",
      "soc": 31,
      "coupledFiles": [
        { "file": "src/core/coupling.ts", "percentage": 0.75, "revisions": 8 }
      ]
    }
  ]
}
```

`coupling` is ordered by `soc`, highest first. Each entry's `coupledFiles` is ordered by `percentage`, highest first. Every entry has at least one coupled file. A pair appears twice across the document, once under each participant — this is existing behavior of `coupling()` and is not being changed.

### Scenario 3 — the path and the flag compose in either order

**Given** a repository at `/path/to/repo`
**When** any of `charlie --json /path/to/repo`, `charlie /path/to/repo --json`, or (from inside the repo) `charlie --json` is run
**Then** all three analyze that repository and print JSON.

The first argument that does not begin with `--` is the repository path. When there is none, the path is `.`. This closes a live defect: today `src/cli/index.ts:9` takes `process.argv[2]` as the path unconditionally, so any flag would be resolved as a directory name.

### Scenario 4 — output is bounded by default

**Given** a repository whose history produces a large number of files and coupled pairs
**When** `charlie --json` is run
**Then** `hotspots` contains only the highest-ranked files, `coupling` contains only the most significant files, and each of those lists only its strongest coupled partners.

Three limits, fixed constants, no configuration surface this round:

| Limit             | Value | Effect                                                                                                        |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| Percentile        | 0.95  | Keeps the top-scoring 5% — of `hotspots` by `complexity * revisions`, and of `coupling` by `soc`              |
| Minimum kept      | 30    | If the percentile leaves fewer than 30 entries, keep 30 (or all of them, if the repository has fewer than 30) |
| Max coupled files | 10    | Each retained `coupling` entry lists at most its 10 highest-`percentage` partners                             |

`hotspots` is ranked by `complexity * revisions`, which is the order `hotspots()` already returns (`src/core/hotspots.ts:19`) — no new notion of significance is introduced.

Measured: **53.5 KB / ~13,700 tokens** on a 518-file repository, **9.9 KB / ~2,500 tokens** on charlie. Bounding `coupling` alone gave 110.9 KB / ~28,400 tokens, so bounding both roughly halves it. Unbounded, the same 518-file repository produced 8.56 MB and roughly 2,245,000 tokens.

**A known limit of this design.** With a floor of 30, the percentile is not what governs the output on ordinary repositories — the floor is. Measured on the 518-file repository, moving the percentile from 0.95 to 0.99 changed the payload from 53.5 KB to 50.4 KB, because both settings bottom out at the floor. The percentile only takes effect above roughly 600 files, and above that it _grows_ the payload as the repository grows: a 5000-file monorepo would retain about 250 entries, on the order of 110,000 tokens. A fixed top-N would not have that property. This is accepted for now — `.charlie.config.json`'s `include` / `exclude` is the existing lever for a monorepo, and `--all` is the escape hatch in the other direction — and is recorded as a lesson candidate.

### Scenario 5 — `--all` removes the bounds

**Given** a repository
**When** `charlie --json --all` is run
**Then** `hotspots` contains every analyzed file and `coupling` contains every file with a SOC score along with every one of its coupled partners.

Ordering is unchanged. On a 518-file repository this produced 8.56 MB; the README says so plainly next to the flag.

`--all` without `--json` is accepted and has no effect on the HTML report, which was already unbounded.

### Scenario 6 — a small or quiet repository

**Given** a repository whose history contains no commit touching more than one file
**When** `charlie --json` is run
**Then** `coupling` is `[]` and `hotspots` still lists every analyzed file.

An empty array, not a missing key and not an error. Exit code 0.

### Scenario 7 — the HTML report keeps showing everything

**Given** a repository
**When** `charlie` is run without `--json` and the report is opened
**Then** the Coupling tab shows every file and every coupled pair, exactly as it does today.

The bounds in scenarios 4 and 5 apply only to JSON output. The frontend renders coupling rows collapsed, so it can afford the full set, and narrowing the HTML report was never requested.

### Scenario 8 — unknown flags

**Given** any repository
**When** `charlie --wat` is run
**Then** the flag is ignored and the run proceeds as if it had not been passed.

No error, no exit code change, no help text. Argument validation is not part of this task; adding it would mean inventing error-reporting behavior nobody asked for.

## Structural requirements

These are binding, because they are what makes the behavior above testable and what CI checks.

- The computation shared between the HTML report and the JSON output lives in one place in `src/core/**`. After this change, `src/frontend/src/data-loader.ts` derives SOC and coupling by calling that Core function, not by composing `soc` / `coupledPairs` / `coupling` itself.
- Argument parsing, payload assembly, and the bounding rules live in `src/core/**` and are pure. `path.resolve`, `process.argv`, `process.stdout`, and `process.stderr` stay in `src/cli/**`.
- Core gates apply to the new modules: 100% statement, function, and line coverage; ≥97% branch; ≥95% mutation score; cyclomatic complexity < 10; cognitive complexity ≤ 10.
- `npm run verify` passes, including `check:deps` (no cycles, Core purity, Stable Dependency Principle) and `check:duplicates`.

## Out of Scope

Recorded so none of it is lost, only deferred.

- **ASCII table output.** Cut by the driver in favor of JSON only. It is also the expensive half: column widths, truncation, and unicode width handling.
- **Word count and ownership in the JSON.** Cut by the driver. `gitHistoryWordCount`, `fileOwnership`, `ownershipDistribution`, and `truckFactor` all exist in the Core and would be additive later; the payload is an object, not an array, precisely so a third key can be added without a breaking change.
- **Architectural-group rollups** (`groupHotspots`) in the JSON.
- **Any `.charlie.config.json` addition,** including a default output format. Raised by the driver, then explicitly withdrawn: "I will take care of it later."
- **Making the three limits configurable** by flag or config. They are constants. `--all` is the only override.
- **Compact-JSON output.** `charlie --json | jq -c .` covers it.
- **Replacing the percentile with a fixed top-N.** The measured limit under Scenario 4 argues for it, but the driver chose the percentile deliberately, twice, and it puts existing Core code to work. Revisit when charlie is first pointed at a repository large enough for the percentile to govern.
- **Deleting `socPercentile`.** After this task it is a thin named wrapper over the shared `topByScore` and still has no direct caller. Left in place; deleting it is a one-line follow-up if wanted.
- **Writing JSON to a file.** Shell redirection covers it.
- **Argument validation, `--help`, `--version`.** Scenario 8 defines the current non-behavior. If the flag count grows to roughly four, `commander` — already an unused dependency — becomes the right answer, and this is recorded as a lesson candidate.
- **De-duplicating the reciprocal pairs** so each pair appears once. Existing `coupling()` behavior, shared with the HTML report; changing it would change the report too.
- **Adding `charlie-report.html` to `.gitignore`.** A real finding from exploration — the tool writes an untracked, un-ignored file into the repo root — but unrelated to this task.
- **Removing `sortCoupledPairs`.** Exploration found it exported, tested, and called from nowhere. `socPercentile` was in the same state and this task adopts it; `sortCoupledPairs` stays dead. Flagged as a lesson candidate, not deleted here.
- **Correcting the stale README claim** that "coupling thresholds and percentile filters are available through the interactive frontend" — `coupling-visualization.tsx` applies no filtering. The README does get edited by this task, so this may be fixed opportunistically in the same paragraph rather than deferred.

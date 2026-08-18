# 01 — Exploration

Task as stated by the driver: "I want to be able to see the charlie data in terminal. Maybe AI can run charlie and see the output itself. ASCII table or JSON would be great for that. I think maybe it existed before? Don't remember."

Track: **full pipeline**. This adds a new user-facing CLI surface (a flag, a new output mode). Lightweight is not available for that.

## Did it exist before?

No. Three independent checks:

1. `src/cli/index.ts` is 29 lines and has exactly one write to stdout — `console.log(\`Report generated successfully at: ${outputPath}\`)` at line 28. There is no other output path.
2. `grep -rniE "ascii|console.table|--json|stdout" src README.md` returns two hits, neither of them an output feature: `src/cli/createGitLogEmitter.ts:26` (`gitProcess.stdout.on('data', ...)`, internal stream plumbing) and `src/cli/git-log-reader.ts:59` (a commented-out `process.stdout.write(chunk)` debug line).
3. `git log --oneline --all` over all 40 commits shows no commit adding or removing terminal/JSON/table output.

Conclusion: the driver is remembering something else. This is new work, not a restoration.

## Current CLI behavior, observed at runtime

`npm run build` (exit 0), then `node dist/cli/cli/index.js`:

```
reading /Users/illia/Projects/charlie/src/frontend/src/colours.ts
reading /Users/illia/Projects/charlie/src/frontend/src/coupling/coupling-table.tsx
reading /Users/illia/Projects/charlie/src/frontend/src/hotspots/coupling-lines.tsx
reading /Users/illia/Projects/charlie/src/frontend/src/App.tsx
Report generated successfully at: /Users/illia/Projects/charlie/charlie-report.html
```

Exit code 0. Produces `charlie-report.html`, 280.8 KB.

Two facts from this run that were not visible from reading `index.ts`:

- **`src/cli/simple-file-reader.ts:14` calls `console.log('reading', filepath)` for every file analyzed.** `node dist/cli/cli/index.js 2>/dev/null | grep -c "^reading "` returns **14** on this repo. On a real codebase this is hundreds of lines. Any JSON written to stdout would be interleaved with these and unparseable. This is a blocking constraint, not a nicety.
- **`charlie-report.html` is written into the repo root and is not in `.gitignore`.** `git status --short` after the run showed `?? charlie-report.html`. Noted; out of scope for this task.

## Argument parsing — a trap

`src/cli/index.ts:9`:

```ts
const repositoryPath = path.resolve(process.argv[2] ?? '.');
```

There is no flag parsing at all. `process.argv[2]` is taken as the repository path unconditionally. So naively adding a flag makes `charlie --json` resolve `--json` as a directory name. Flag parsing has to be introduced properly, not bolted on.

`commander` ^11.1.0 is listed in `dependencies` in `package.json` and is **imported nowhere** — `grep -rn commander src` returns nothing. It is dead weight today, which also means it is not established precedent.

## Data available, and where it lives

All of the analysis lives in `src/core/**` and is pure. Relevant exports:

| Module                   | Export                                                  | Shape                                                                             |
| ------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `core/hotspots.ts`       | `hotspots(revisions, visualComplexity)`                 | `Promise<Hotspot[]>`, `Hotspot = { file, complexity, revisions }`                 |
| `core/soc.ts`            | `soc(logItems)`                                         | `Soc[]`, `Soc = { file, soc }`                                                    |
| `core/coupled-pairs.ts`  | `coupledPairs(logItems)`                                | `CoupledPair[] = { file1, file2, percentage, revisions }`                         |
| `core/coupling.ts`       | `coupling(coupledPairs, socs)`                          | `CouplingItem[] = { file, soc, coupledFiles: { file, percentage, revisions }[] }` |
| `core/file-ownership.ts` | `fileOwnership`, `ownershipDistribution`, `truckFactor` | ownership metrics                                                                 |
| `core/word-count.ts`     | `gitHistoryWordCount(logItems)`                         | `Record<string, number>`                                                          |
| `core/group-hotspots.ts` | `groupHotspots(hotspots, architecturalGroups)`          | hotspots rolled up by architectural group                                         |

The HTML frontend exposes four tabs (`src/frontend/src/App.tsx:11`): `hotspots`, `soc` (labelled "Coupling"), `word-count`, `ownership`.

**Where the composition currently happens matters.** The CLI computes only `hotspots` and `wordCount` (`src/cli/index.ts:15,24`); it ships raw `logItems` into the HTML and lets the _browser_ derive SOC and coupling — `src/frontend/src/data-loader.ts:18-30`:

```ts
const socData = loadSoc(logItems);
const coupledPairsData = coupledPairs(logItems);
return { ..., coupling: coupling(coupledPairsData, socData), ... };
```

So for the CLI to emit coupling, that derivation has to move to (or be duplicated in) the Node side. This is the real work of the task; the JSON serialization itself is trivial.

## Architecture constraints that bind this task

From `DISCIPLINE.md` and `AGENTS.md`:

- Payload assembly and argument parsing are pure decisions, so they belong in `src/core/**`, subject to 100% statement/function/line coverage, ≥97% branch, ≥95% mutation score, cyclomatic <10, cognitive ≤10.
- The Shell (`src/cli/**`) gets only `process.stdout.write` and the wiring.
- Core imports nothing from Shell. `npm run check:deps` enforces cycles, Core purity, and the Stable Dependency Principle.
- `npm run check:duplicates` (jscpd, strict) will see any copy of the `data-loader.ts` coupling derivation.

## Hotspot awareness

`src/cli/index.ts` is Shell, small, and has been touched by the recent core/shell refactor commits (`d7f0766 refactor: move git-log composition to the composition root`). It is the composition root by design, so adding wiring there is with the grain, not against it. No Core hotspot is being entered.

## Open unknowns going into Challenge

- Whether to fix `simple-file-reader.ts`'s stdout logging by removing it or redirecting it to stderr. (Resolved in `02-decisions.md`.)
- Whether the frontend's `data-loader.ts` should be refactored to share the new Core composition, or left alone this round. (Resolved in `03-spec.md` Out of Scope.)

# 03 — Specification

## What this change is

Charlie's behaviour does not change. Run it against a repository before and after and the report is identical. This is a structural change: it moves three type declarations, moves three lines of wiring, extracts one loop, and narrows one rule's scope, so that the architecture the code already intends is the architecture the code actually has.

The observable outcome is that the quality gates go green.

## Behaviour that must be preserved

This is the binding half of the spec. Everything below is currently true and must remain true.

- **Given** a repository with git history, **when** `charlie` runs against it, **then** it writes `charlie-report.html` with the same hotspots, coupling, ownership and word-count data as before this change.
- **Given** the existing test suite, **when** it runs, **then** all 75 tests pass, and no test's _assertions_ are modified. Import paths and the names of things under test may change; what they assert may not.
- **Given** `src/core`, **when** coverage runs, **then** statements, functions and lines stay at 100% and branches at or above 97%.
- **Given** `src/core`, **when** mutation testing runs, **then** the score stays at or above 95%.

That last pair is the real risk of this change. Moving code between modules can silently drop it out of the Core coverage scope, which would show as a _rise_ in percentage while testing less. The verification step checks the absolute count of covered Core files, not just the percentage.

## Scenarios

### S1 — the Core declares the shapes it needs

**Given** `applyFilters` needs include and exclude patterns, and `groupGitLog` needs a group mapping,
**when** each declares its own parameter type in Core terms,
**then** no module under `src/core` imports from `src/cli` or `src/frontend`,
**and** every existing call site still compiles while passing a whole `Config`.

### S2 — composition lives at the composition root

**Given** `cli/index.ts` is the composition root,
**when** the wiring of the real git emitter to the parser moves there,
**then** `git-log-reader.ts` no longer imports `createGitLogEmitter.ts`,
**and** the dependency cycle between those two modules is gone.

### S3 — the `Revisions` type is separated from the code that builds it

**Given** `src/core/git-log.ts` already demonstrates a type-only module with `I = 0%`,
**when** `revisions.ts` is split the same way,
**then** `hotspots.ts` depends only on a module at least as stable as itself,
**and** the function is named for what it does.

### S4 — the stream handler fits the cognitive budget

**Given** `produceGitLog` scores 11 against a budget of 10,
**when** the buffer-draining loop is lifted out of the `onData` callback,
**then** every function in the file scores 10 or below,
**and** the streaming contract is unchanged — the existing chunk-boundary test passes untouched.

### S5 — the SDP rule is scoped to where its claim holds

**Given** the rule reduces to "no component may import more modules than its parent" in a React tree,
**when** `not-to-unstable` is scoped to `src/core` and `src/cli`,
**then** the frontend is still checked for cycles and Core purity,
**and** `npx depcruise src` reports zero violations.

### S6 — the repository is formatted

**Given** `README.md` has never been through Prettier,
**when** it is formatted,
**then** `npx prettier --check .` passes.

## Error behaviour

Unchanged. `produceGitLog` still rejects on spawn error and on a non-zero exit code, still writes stderr through, and still swallows a malformed file-entry line with a logged error rather than failing the run. The two rejection tests are the guard on this.

## Edge cases

- A `Config` with an empty `include` list means "include everything". Preserved by `filters.ts` unchanged — only its parameter type moves.
- A commit whose file entries all get filtered out is dropped entirely. Unchanged.
- `hotspots()` filters out files with zero complexity. Unchanged.

## Out of scope

Deliberately not done this round. Each is a real finding.

- **Moving `produceGitLog` and `parse-log.ts` into the Core** behind an error-reporting port. The correct end state; needs its own spec because it has to invent the port.
- **Humble Object extraction from `hotspots.tsx` (250 lines), `FileOwnership.tsx` (218), `coupling-row.tsx` (206).** Pure decisions living inside React components.
- **Tests for `src/frontend`** — 17 files, zero tests. Same finding as the line above, seen from the test side.
- **Narration comments** in `index.tsx`, `report-generator.ts`, `visualizeWordCount.tsx`, `FileOwnership.tsx`, `coupling-lines.tsx`, and the section comments organising `colours.ts`. Sweeping files this change does not otherwise touch would be unrelated diff noise.
- **`Math.random()` in `git-log-reader.test.ts`**, which makes a failure unreplayable.
- **Shell test gaps** — `cli/index.ts`, `readHotspots.ts`, `report-generator.ts`, `simple-file-reader.ts`, `createGitLogEmitter.ts` have no tests.
- **A cohesion metric.** Left open at adoption; the driver has one in progress.

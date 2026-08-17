# 02 — Decisions

## The standing question: can we not do A, B, C?

Mostly no, and the reason is structural. CI must be green for the PR to merge (§178), so every machine-checked violation has to go in this round. The scope cuts available are the ones nothing checks — and those are cut aggressively below.

## D1 — `Config` in the Core (violations 2, 3)

**Chosen: the Core declares the narrow shapes it needs; the `Config` type does not move.**

`applyFilters` uses exactly two fields of `Config`, and `groupGitLog` uses exactly one. Neither needs the whole type.

```ts
// src/core/filters.ts
export type FilterRules = { include: RegExp[]; exclude: RegExp[] };
export function applyFilters(items: LogItem[], rules: FilterRules): LogItem[];

// src/core/group-git-log.ts
export function groupGitLog(
  items: LogItem[],
  groups: Record<string, string>
): LogItem[];
```

TypeScript's structural typing means every existing call site still compiles while passing a whole `Config`.

**Rejected — move the `Config` type into `src/core/config.ts`.** It fixes the arrow, but it makes the Core own a type whose only reason to exist is that a JSON file has those four keys. The Core would then be coupled to the config file's shape: add a Shell-only key and the Core type changes. Declaring the two narrow shapes costs the same edit and says something true — §48, "the Core defines the shape of the dependency in its own terms."

**Rejected — leave it, the import is type-only.** `import type` still creates the edge, and the rule is about direction, not about what survives compilation. More to the point: a type-only dependency is exactly how a real one starts.

## D2 — the cycle and the `cli` SDP edge (violations 1, 5)

**Chosen: move the composition out of `git-log-reader.ts` into `cli/index.ts`.**

`getLogItems` at `git-log-reader.ts:83` constructs the real emitter and wires it to the parser. That is composition, and `cli/index.ts` is already the composition root — it calls `getLogItems` at line 13. Moving those three lines up removes `git-log-reader → createGitLogEmitter`, which is both the cycle's closing edge and the `63% → 67%` SDP violation. Two findings, one edit, no new module.

`GitLogEmitter` stays declared in `git-log-reader.ts`. The consumer owning the shape of its dependency is correct and is the reason the port exists at all.

**Rejected — extract `GitLogEmitter` into its own module.** Breaks the cycle but leaves `git-log-reader → createGitLogEmitter` in place, so the SDP violation survives and we would have added a file for nothing.

**Rejected — move `produceGitLog` into the Core with `GitLogEmitter` as an injected port.** This is the architecturally correct end state: the function is a text parser with a streaming effect, and §44 says logic that is hard to test belongs in the Core. It is out of scope for this round because `produceGitLog` writes to `process.stderr` and `console.error` (lines 52, 64, 68, 74), so the move requires also inventing an error-reporting port, and because the pure parsing it calls (`parse-log.ts`) would have to move with it. That is its own spec. Recorded as out-of-scope, not lost.

## D3 — SDP inside the Core (violation 4)

**Chosen: split `revisions.ts` into a type module and a behaviour module, following the `git-log.ts` precedent.**

`src/core/git-log.ts` already demonstrates the pattern: a concept-named module holding only types, `I = 0%`, 20 dependents, and the code that _produces_ those types living elsewhere. `revisions.ts` currently mixes both roles, which drags the widely-shared `Revisions` type down to the volatility of the function beside it.

- `src/core/revisions.ts` — the `Revisions` type only. `Ce = 0`.
- `src/core/count-revisions.ts` — `countRevisions(history)`. The rename is a bonus: a function called `revisions` that returns `Revisions` says nothing about what it does.

**Rejected — move the `Revisions` type into `hotspots.ts` so the consumer owns it.** Two files instead of four, and it does fix the arrow. But `Revisions` is plain data flowing through the system, not an effect the Core needs injected, so §48 does not apply. A producer importing its output type from one particular consumer reads backwards, and the second consumer that appears has to import from `hotspots.ts` for no reason.

**Rejected — extract the `Hotspot` type out of `hotspots.ts` instead.** Fixes the violation from the other side and is arguably just as principled, but touches ten dependent modules rather than four.

## D4 — cognitive complexity (violation 7)

**Chosen: extract the buffer-draining loop into a local function inside `git-log-reader.ts`.**

The `onData` callback nests four deep: buffer append, `includes` guard, `for` loop, `if/else if`, `try/catch`. Lifting the loop body out drops the callback under the budget without changing the streaming contract.

**Rejected — move the parsing into the Core.** Same reasoning as D2's third option, and the same out-of-scope entry.

**Rejected — raise the cognitive budget to 11.** Thresholds ratchet up, never down (§265). Fitting the gate to the code is how a ratchet turns into a suggestion.

## D5 — `frontend/App.tsx → hotspots/hotspots.tsx` (violation 6)

**This one needs the driver's decision. It is the only open question in this document.**

The measurement: `App.tsx` has `Ca = 1, Ce = 6, I = 86%`. `hotspots/hotspots.tsx` has `Ca = 1, Ce = 14, I = 93%`. The rule fires because a parent depends on a child that imports more than it does.

That is not an accident of this file. In a component tree the parent imports its children, and a leaf-ward component that pulls in d3, three Core modules and four sibling components will always be more unstable than the shell above it. With `Ca = 1` on both sides, `I = Ce / (1 + Ce)`, so the rule reduces to **"no component may import more modules than its parent does"** — which inverts how React composition works.

To satisfy it as configured, `hotspots.tsx` would have to drop from 14 dependencies to 6. Extraction does not help: any module it delegates to is still a dependency. The only structure that satisfies the rule is a flat one where `App.tsx` imports all fourteen pieces itself and orchestrates them — trading a readable component tree for a metric.

Nor can the pure logic escape to the Core. `packData` and `mkColor` operate on `d3.HierarchyCircularNode`, and the `core-no-io` rule forbids the Core from importing d3. Only `colorizeWithImportance` and `getColorDomain` are plain arithmetic, and moving those two _adds_ an import to `hotspots.tsx`.

So the honest options:

1. **Scope `not-to-unstable` to `src/core` and `src/cli`.** The principle holds where dependency direction is a design choice. In a rendered component tree it is dictated by the UI shape. Costs: the frontend loses SDP checking; `no-circular` and `core-purity` still cover it.
2. **Move SDP to folder level.** `src/frontend/src` and `src/frontend/src/hotspots` become the compared units. Closer to the wording in §70, which says _modules_.
3. **Restructure the frontend to satisfy the file-level rule.** Flattens the component tree into `App.tsx`. Large, and it makes the code worse.

Recommendation: **option 1**. It is not lowering a threshold to dodge work — it is narrowing a rule to the scope where its claim is true, which §67's "low, or more precisely _appropriate_" already anticipates. Option 3 is the only one that keeps the rule universal, and it buys a worse frontend.

**Driver's decision: option 1.** `not-to-unstable` is scoped to `src/core` and `src/cli`. The frontend keeps `no-circular` and `core-purity`. The Humble Object work on `hotspots.tsx` remains a real finding and stays on the deferred list below — it is now deferred on its own merits rather than forced by a metric.

## Scope cuts — what is deliberately not in this round

Every item below is a real finding, deferred on purpose:

- **Move `produceGitLog` and `parse-log.ts` into the Core** behind an error-reporting port. The right end state; needs its own spec.
- **Humble Object extraction from `hotspots.tsx` (250 lines), `FileOwnership.tsx` (218), `coupling-row.tsx` (206).** Decisions living in React components.
- **Zero tests in `src/frontend`** across 17 files. §44 says this is the signal that logic is stuck in the Shell — the same finding as the line above, seen from the test side.
- **Narration comments in `index.tsx`, `report-generator.ts`, `visualizeWordCount.tsx`, `FileOwnership.tsx`, `coupling-lines.tsx`**, and the undecorated section comments organising `colours.ts`. Not touched by this change, so sweeping them would be unrelated diff noise.
- **`Math.random()` in `git-log-reader.test.ts`** makes failures unreplayable.

Slop is swept only in `git-log-reader.ts`, because that file is being edited anyway.

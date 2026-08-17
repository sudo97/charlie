# 01 — Exploration

**Branch:** `core-shell-boundaries`
**Track:** full pipeline
**Driver:** Illia (engineer-driven, §208)

## Gate arrangement for this run

The driver elected to review every phase artifact at the PR rather than approving phases 1–4 in turn. This is the engineer-driven shortcut in §210; it is recorded here rather than assumed silently. All gates still exist — they are simply all collected at the PR.

## What prompted this

CI landed red when the discipline toolchain was adopted, by design. This run fixes the architectural violations it surfaced. The violation list was produced by running the gates, not by reading code.

## Facts gathered

### The gates and what they report today

Every number below is from a command run against this working tree, not from memory.

| Command                       | Result                                                          |
| ----------------------------- | --------------------------------------------------------------- |
| `npx depcruise src`           | 6 errors: 1 cycle, 2 core-purity, 3 Stable Dependency Principle |
| `npx eslint .`                | 1 error: `produceGitLog` cognitive complexity 11 > 10           |
| `npx prettier --check .`      | 1 warning: `README.md`                                          |
| `npx vitest run --coverage`   | passes — Core 100% statements/functions/lines, 97.32% branches  |
| `npx stryker run`             | passes — Core mutation 95.19%, 17s                              |
| `npx jscpd src --mode strict` | passes — 0 clones                                               |

### Instability metrics

From `npx depcruise src --output-type metrics`. Instability is `I = Ce / (Ca + Ce)`.

| Module                           | Ca  | Ce  | I   |
| -------------------------------- | --- | --- | --- |
| `src/core/git-log.ts`            | 20  | 0   | 0%  |
| `src/core/hotspots.ts`           | 10  | 1   | 9%  |
| `src/core/revisions.ts`          | 3   | 1   | 25% |
| `src/cli/config.ts`              | 6   | 2   | 25% |
| `src/core/filters.ts`            | 2   | 2   | 50% |
| `src/cli/git-log-reader.ts`      | 3   | 5   | 63% |
| `src/cli/createGitLogEmitter.ts` | 1   | 2   | 67% |
| `src/core/group-git-log.ts`      | 1   | 3   | 75% |

`src/core/git-log.ts` is the most instructive row. It holds only the `LogItem` and `FileEntry` types, imports nothing, and 20 modules depend on it — `I = 0%`, maximally stable. **The codebase already has a precedent for separating a widely-shared type from the behaviour around it.** Three of the violations below are cases where that separation was not applied.

### Violation 1 — the dependency cycle

`src/cli/createGitLogEmitter.ts:2` imports the type `GitLogEmitter` from `git-log-reader.ts`.
`src/cli/git-log-reader.ts:3` imports the function `createGitLogEmitter` from `createGitLogEmitter.ts`.

The type is declared at `git-log-reader.ts:7-12` — the consumer owns the shape of its dependency, which is correct. The cycle comes from the other direction: `getLogItems` at `git-log-reader.ts:83-88` performs composition — it constructs the real emitter and wires it to the parser. Composition in a module that also defines a port is what closes the loop.

`src/cli/index.ts:13` is the actual composition root and already calls `getLogItems`.

### Violation 2 and 3 — Core purity

`src/core/filters.ts:2` and `src/core/group-git-log.ts:1` both import the `Config` type from `src/cli/config.ts`.

`Config` is declared at `cli/config.ts:12-17`:

```ts
export type Config = {
  include: RegExp[];
  exclude: RegExp[];
  after: Date;
  architecturalGroups: Record<string, string>;
};
```

Nothing about it is Shell-shaped. There are no file paths, no zod types, no JSON. It is a domain description of which commits and files an analysis considers. The Shell part of that file is `parseConfig` and `readConfigFile` (lines 19–44), which do use zod, `fs` and `path`. **The type and the parsing live in one file, and only the parsing belongs to the Shell.**

### Violation 4 — SDP, `core/hotspots.ts` → `core/revisions.ts` (9% → 25%)

`hotspots.ts:1` imports the `Revisions` type from `revisions.ts:3`. `revisions.ts` declares both the type and the `revisions()` function that builds one. Ten modules depend on `hotspots.ts` (they want the `Hotspot` type); three depend on `revisions.ts`.

Same shape as violations 2 and 3: a stable type is parked in a module that also holds volatile behaviour, which drags the type's stability down to the behaviour's level.

### Violation 5 — SDP, `cli/git-log-reader.ts` → `cli/createGitLogEmitter.ts` (63% → 67%)

Same root cause as violation 1. The composition call at `git-log-reader.ts:85` is the only reason this edge exists.

### Violation 6 — SDP, `frontend/App.tsx` → `hotspots/hotspots.tsx` (86% → 93%)

A 7-point gap between two already-volatile leaf components. Unrelated to the Core/Shell work; see 02-decisions.

### Violation 7 — cognitive complexity

`produceGitLog` at `src/cli/git-log-reader.ts:20`, cognitive 11 against a budget of 10. Cyclomatic is 7, under the limit of 10 — the two metrics disagree, and the cognitive one is right: the cost is nesting. The `onData` callback (lines 28–60) holds a buffer, a split, a loop, two branches and a try/catch, four levels deep.

That parsing is pure. It takes text, returns `LogItem[]`. It sits in the Shell because the streaming lives there.

### Violation 8 — slop in `src/cli/git-log-reader.ts`

- Lines 29, 31, 42, 58, 59 — five commented-out `console.log` / `process.stdout.write` statements. Debug artifacts (§173).
- Lines 30, 63 — `// Process each chunk of data as it comes in`, `// Handle error output`. Restatement of the code below them (§187).
- Lines 17–18 — `// Then I also decided to write tests for this...` narrating the author's history rather than a constraint.
- Lines 14–16 — this one earns its place. "I tried using isomorphic-git, but it was very slow" is a constraint from the outside world that no name could carry. It should survive, trimmed.

### Violation 9 — `README.md` formatting

Pre-existing. `format:check` existed in `package.json` before this adoption but was never wired into CI, so nobody saw it.

## An experiment that corrected me

`src/tests/cli/git-log-reader.test.ts:53-63` builds its input with `[...(items.map(...).join('') + '\n\n')]`. I assumed the spread produced a one-element array, which would make the `Math.random()` chunking at line 69–70 decorative — the listener would receive the whole payload in one call regardless.

I ran it rather than trusting the reading:

```
array length: 48
call 1 requested 6 got "'--123"...
call 2 requested 5 got "456--"...
...
total listener calls: 9
```

The spread splits the string into **characters**. The chunking is real, the test genuinely exercises payload boundaries mid-token, and any rewrite of `produceGitLog` must keep passing it. My reading was wrong; the experiment was cheap.

Separately: the randomness makes the test non-reproducible. A failure cannot be replayed. That is a test-quality observation, not a discipline violation, and it is out of scope here.

## Unknowns

- Whether moving the `Config` type into the Core changes any instability figure enough to trip a _different_ SDP edge. The rule is transitive in effect but checked per-edge, so this must be verified by running `depcruise` after the change, not predicted.
- Whether `produceGitLog` can be decomposed without changing the streaming contract. The existing test is the arbiter.

## Hotspot awareness (§280)

`src/cli/git-log-reader.ts` is touched by four of the nine findings. It is the natural hotspot of this change set. Steps involving it are kept small and individually verified.

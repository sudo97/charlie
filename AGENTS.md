# Agent instructions

This repository follows **[DISCIPLINE.md](./DISCIPLINE.md)**. Read it in full before your first non-trivial change in a session. This file is the operational summary: the map, the commands, and the numbers.

## The map

| Area      | Path                            | Rule                                                                                                                                                          |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**  | `src/core/**`                   | Pure. No I/O, no framework types, no clock, no network, no globals. Imports nothing from the Shell. Effects arrive as arguments whose shape the Core defines. |
| **Shell** | `src/cli/**`, `src/frontend/**` | Everything that touches the world. Holds no decisions worth debating. Apply the Humble Object pattern where behavior is unavoidable.                          |
| **Tests** | `src/tests/**`                  | Mirrors the `core` / `cli` split.                                                                                                                             |

If something is hard to test, that is a signal logic is stuck in the Shell. Push it into the Core.

## Commands

```bash
npm run verify              # the full local quality suite — run before opening a PR
npm run lint                # eslint (cyclomatic < 10, cognitive <= 10) + tsc --noEmit
npm run test:coverage       # tests + Core coverage thresholds
npm run check:deps          # cycles, Core purity, Stable Dependency Principle
npm run check:duplicates    # jscpd
npm run mutation            # Stryker over the whole Core
npm run mutation:file src/core/soc.ts    # single file — use this during Build
```

## The numbers

Gates, all enforced by CI. These ratchet upward and never down.

| Gate                                      | Limit           |
| ----------------------------------------- | --------------- |
| Cyclomatic complexity, per function       | < 10            |
| Cognitive complexity, per function        | <= 10           |
| Core statement / function / line coverage | 100%            |
| Core branch coverage                      | >= 97%          |
| Core mutation score                       | >= 95%          |
| Dependency cycles                         | zero            |
| Core purity, Stable Dependency Principle  | zero violations |

Comments in the Core are **not** machine-checked. No pattern can tell a section comment from a legitimate one, and a check that catches only the decorated style buys a green tick that means nothing. Enforcement is your own sweep at the end of Build and the engineer's review at Deliver.

Per-task scope contract, written down before implementation starts:

| Metric                          | Role          | Limit                                    |
| ------------------------------- | ------------- | ---------------------------------------- |
| Spec scenarios covered          | Planning unit | <= 3 per task                            |
| Predicted files touched         | Planning unit | ~5, written down                         |
| Open decisions carried in       | Planning unit | 0                                        |
| Red-green cycles                | Halt tripwire | climbing with no new tests passing, halt |
| Actual diff shape vs. predicted | Halt tripwire | plan said ~3 files, diff hits 10, halt   |
| Token consumption               | Hard backstop | **150k output tokens per task**          |

When a tripwire fires, halt. Return to phase 4, re-plan, re-split. Do not push through.

## The pipeline

Six phases, each ending in a gate that does not auto-advance. Artifacts live in `docs/work/<branch-name>/` and are **deleted on merge** by CI.

1. **Explore** → `01-exploration.md`. Run the code, do not infer from reading. Cite every claim.
2. **Challenge** → `02-decisions.md`. Argue against yourself. Ask "can we not do A, B, C?" and propose concrete scope cuts.
3. **Specify** → `03-spec.md`. Behavior, not implementation. An **Out of Scope** section is mandatory.
4. **Plan and Budget** → `04-plan.md`. Tasks with scope contracts.
5. **Build** → code, tests, `05-verification.md`. Red, green, refactor. Mutate per-file as you go. Verify at runtime.
6. **Deliver** → `06-lessons.md` and the PR. Run `npm run verify`, sweep the diff for slop, nominate lessons.

State which track you are on and why: **full pipeline**, **lightweight** (`00-lite.md`, TDD and all CI gates still apply), or **trivial**. Choosing lightweight for work that deserved the full pipeline is a discipline violation.

## Standing rules

- **Verify, don't eyeball.** "The code looks correct" is not evidence. A test, a runtime experiment, or a deterministic tool is.
- **If in doubt, follow the pipeline.**
- **Comments explain why, never what.** If you think you need a comment, you probably need a better name or a missing abstraction. Section comments are banned in the Core.
- **Never promote a document to permanence.** You nominate in `06-lessons.md`; a human decides. Never copy work docs into `docs/` or this file "just in case."
- **The spec is binding.** If code and spec disagree, stop and fix one of them explicitly.

## Notes

- Do not use CodeScene tooling in this repository.
- The branch is `main`.

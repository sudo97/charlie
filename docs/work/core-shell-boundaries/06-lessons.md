# 06 — Lessons learned

Candidates nominated for a human to decide on before this folder is erased. Nominating is not keeping. The bar applied to each: **would you tell this to the next agent before it starts, and would it change what they do?**

Three survived. Two were cut, and the cuts are listed at the end so the filtering is visible.

---

## 1. A trap — `chunk.toString()` in `git-log-reader.ts` is load-bearing despite its type

**What.** `GitLogEmitter.onData` is typed `(chunk: string) => void`, so `buffer += chunk.toString()` reads as a redundant no-op that a slop sweep would delete on sight. It is not. `createGitLogEmitter` wires that listener to `gitProcess.stdout.on('data', ...)`, and Node delivers a **Buffer** there. The type is wrong; the call is what makes the code work.

**Why it might outlive the PR.** Deleting it breaks the real CLI while all 75 tests stay green, because every test passes strings. This is a silent, test-invisible regression sitting in the most-edited file in the codebase — and the deletion is exactly what §157's "remove the slop" instruction invites.

**Where it would live.** Not a comment — the comment I added is the weak fix. The right fix is to make the type honest: `onData: (listener: (chunk: Buffer | string) => void) => void`, after which `.toString()` is visibly necessary and no note is needed. I did not do it here because listener contravariance under `strictFunctionTypes` means the three test doubles must change signature too, and `03-spec.md` binds this change to not touching tests. **Recommend: a follow-up task, one file plus three test signatures.**

---

## 2. A surprise — the knowledge graph reports zero cycles while dependency-cruiser finds one

**What.** Structural queries against the indexed graph returned `cycles_total: 0` for this repository. `depcruise` found a real cycle between `createGitLogEmitter.ts` and `git-log-reader.ts` in the same working tree. Both were right: the graph scans `CALLS` edges, dependency-cruiser scans `IMPORTS`. The cycle was closed by a _type_ import, which produces no call.

**Why it might outlive the PR.** An agent that reaches for the graph to answer "are there cycles?" gets a confident, clean, wrong answer. This is the failure mode the discipline warns about in §18 — a claim that looks verified but was measured with the wrong instrument.

**Where it would live.** One line in `AGENTS.md` under the commands table: cycle and coupling questions are answered by `npm run check:deps`, not by the graph.

---

## 3. A decision with a long shadow — file-level SDP does not survive contact with a React tree

**What.** With `Ca = 1` on both sides of a parent-child component edge, `I = Ce / (1 + Ce)`, so `not-to-unstable` reduces to "no component may import more modules than its parent." That is a claim about React composition, not about coupling. `App.tsx` → `hotspots.tsx` (86% → 93%) was unfixable without flattening the component tree into the root, and the pure logic could not escape to the Core because it operates on `d3.HierarchyCircularNode` types the `core-no-io` rule forbids.

**Why it might outlive the PR.** In six months someone will see `from: { path: '^src/(core|cli)' }` and read it as a gate that was quietly weakened to make CI pass. The rationale is not recoverable from the config alone.

**Where it would live.** Already fixed in the diff, per §202 — the rationale is written into the rule's `comment` field in `.dependency-cruiser.cjs`, where anyone reading the rule sees it. Recorded here only so the reviewer knows the decision was deliberate and where its reasoning now lives. **No further action needed.**

---

## Considered and cut

- **`[...someString]` spreads to characters, so the chunking in `git-log-reader.test.ts` is genuinely random.** Discovering this corrected a wrong assumption and is written up in `01-exploration.md` as the experiment that earned its keep. But as a _lesson_ it fails the test: it is one `node -e` away for anyone who wonders, and knowing it in advance would not change what the next agent does. Search cost is not the bar (§200).
- **Branch coverage rising can mean tests left the scope, not that testing improved.** Real, and it nearly slipped past during T3 — but `03-spec.md` already made the file-count check part of the spec, and the same instinct is one that CI's absolute thresholds enforce anyway. Keeping it would be padding.

---

An empty lessons file is a perfectly good outcome, and three is close to it. Items 1 and 2 are the two worth a human's attention; item 3 is already handled in the diff.

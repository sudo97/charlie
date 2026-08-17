# The Development Discipline

A workflow for AI-assisted development in this repository. It applies to everyone who has an AI agent write code here — engineers and non-engineers alike — and to the agents themselves. It is written to be readable by both.

The short version: the agent explores, argues with itself, writes a spec, agrees on it with you in your language, breaks the work into small budgeted tasks, builds test-first, verifies at runtime, cleans up after itself, and opens a PR. Engineers review the PR. CI is the referee. The documentation that explains the work lives exactly as long as the PR and no longer.

---

## Core Principles

1. **Code is the only permanent source of truth.** Everything else — design documents, planning notes, architectural debates — is temporary scaffolding.
2. **Documentation has a lifespan.** Specs and decision logs exist to facilitate human review during the PR. They do not survive the merge.
3. **The PR is the arena for reasoning.** Engineers review the code and the ephemeral documentation that explains why it was written that way.
4. **CI is the ultimate gatekeeper.** No amount of vibe can bypass deterministic, automated quality checks.

Two corollaries the agent must internalize:

- **Verify, don't eyeball.** A claim about behavior is unverified until it has been demonstrated by a test, a runtime experiment, or a deterministic tool. "The code looks correct" is not evidence.
- **If in doubt, follow the pipeline.** If there is even a small chance a phase applies to the task at hand, run it. "This is simple, I'll skip it" is how bugs are born. Trivial known-pattern fixes may run the lightweight track (see Task Sizes), but the decision to do so must be stated explicitly, not assumed silently.

---

## Architecture Rules

These rules are what CI enforces and what every design conversation must respect.

### Core and Shell

The codebase is split into a **Core** and a **Shell**.

- The **Core** is big. It contains the domain logic, the decisions, the calculations, the rules. It is pure or near-pure: no I/O, no framework types, no clock, no network, no globals. It must be trivially testable — construct inputs, call functions, assert outputs.
- The **Shell** is thin. It contains everything that touches the world: UI, HTTP, database, filesystem, queues, framework wiring. The Shell holds no decisions worth debating — it translates between the world and the Core.

When a piece of Shell code cannot avoid containing behavior (a UI component, a controller), apply the **Humble Object** pattern: extract every decision into a Core object that is tested exhaustively, and leave behind a humble wrapper so thin that its correctness is nearly self-evident.

Coverage and quality targets are asymmetric by design:

|                      | Core                   | Shell                             |
| -------------------- | ---------------------- | --------------------------------- |
| Line/branch coverage | High (threshold in CI) | Tested where applicable           |
| Mutation score       | High (threshold in CI) | Not required                      |
| Typical tests        | Unit, property-based   | Snapshot, smoke, thin integration |

If a task keeps being hard to test, that is not a testing problem — it is a signal that logic is stuck in the Shell and must be pushed into the Core.

**Dependency Injection into the Core.** Sometimes the Core genuinely needs an effect — read a record, get the time, send a notification. That is fine, _if the effect comes in through the front door_: the Core declares what it needs as a parameter (a plain function, a small object, an interface), and the Shell passes the real implementation in at the composition point. In tests, the Core receives a fake. The rules:

- The Core defines the shape of the dependency in its own terms (`getCurrentTime`, `saveOrder`), never in the technology's terms (`PostgresClient`, `HttpSession`).
- **Favor the simplest wiring that works.** Simple functions or objects passed as arguments (or constructor parameters) is the default, and in most stacks it is enough. Don't introduce a DI framework — a new tool to learn, a hidden dependency graph — where plain arguments would do; this is especially true in plain JS/TS, where a container is almost always too much machinery.
- **Where the stack already ships mature DI, use it — at the edge.** Symfony autowiring is fine: it lives in the Shell, wiring composition. What stays non-negotiable is that the _Core_ never knows about it — no container types, no framework attributes/annotations on Core classes, no service-locator lookups from inside Core code. The Core receives plain arguments and cannot tell whether a human or a container passed them.
- If wiring by hand feels painful in a stack without built-in DI, the design has too many dependencies — fix the design before reaching for a container.

So "Core purity" precisely means: the Core imports nothing from the Shell, frameworks, or I/O libraries. It may _receive_ effects as arguments, defined by shapes it owns.

### Cohesion

Things that belong together must live together. A module should have one reason to exist and one reason to change. Cohesion is measured by tooling (chosen at adoption — see Adopting This Discipline) and the trend must not degrade. When the agent finds itself writing **section comments** inside a file —

```
// -- VALIDATION ----------
```

— that is a code smell, not organization. A section comment is a missing abstraction announcing itself. Extract it.

### Coupling

Coupling must be low — or more precisely, _appropriate_. Two rules are **non-negotiable and enforced by CI**:

1. **No dependency cycles.** Anywhere, at any level (module, package, file).
2. **The Stable Dependency Principle** (Robert C. Martin's package principles). Dependencies point toward stability. "Stability" here is a _structural_ measure, not a judgment call: for a module, count its afferent couplings **Ca** (how many modules depend on it) and its efferent couplings **Ce** (how many modules it depends on); instability is **I = Ce / (Ca + Ce)**, from 0 (maximally stable — many dependents, few dependencies, hard to change) to 1 (maximally volatile — free to change because nothing depends on it). The rule: a module may only depend on modules that are at least as stable (lower or equal _I_) than itself; volatile code may depend on stable code, never the reverse. Note this is unrelated to the _churn rate_ discussed under Periodic Audits — that one measures how often a file changes in history; this one measures the dependency structure right now.

The Core depends on nothing in the Shell. The Shell depends on the Core. That direction never flips.

### Complexity

- Cyclomatic complexity of every function must be **below 10**. CI fails otherwise.
- Cumulative/cognitive complexity per file is also tracked where tooling allows (chosen at adoption); the budget per file is a soft gate that hardens over time.

---

## The Pipeline

Every non-trivial change runs six phases. Each phase produces an artifact, and each phase ends with a **gate** — an explicit approval before moving on. Nothing auto-advances.

Who approves a gate depends on who is driving (see Working Modes below), but the rule is the same: **the human driving the session approves phases 1–4 in their own language; engineers approve phase 6 through the PR; CI approves everything it can measure.**

All phase artifacts live in `docs/work/<branch-name>/`. They are committed, they travel with the PR, they are read by reviewers — and they are deleted on merge (see Documentation Lifecycle).

### 1. Explore

_Goal: understand before touching anything._

The agent gathers facts: the relevant parts of the codebase, existing patterns and conventions, dependencies, constraints, prior art in the repo, and what the requirement actually means. Where behavior is uncertain, the agent **runs the code** — small scripts, REPL experiments, existing tests — rather than inferring from reading. Every claim in the output cites its source: a file path, a command output, a test run, a user statement.

**Output:** `01-exploration.md` — what exists, what is relevant, what is unknown.
**Gate:** the driver confirms the agent's understanding of the problem is correct.

### 2. Challenge

_Goal: stress-test the design before committing to it._

The agent proposes an approach, then argues against itself as a devil's advocate: What breaks? What's the simplest alternative? Does this fit the existing system, or does it fight it? Does it respect Core/Shell? Where would the dependency arrows point? What is the smallest version that delivers value?

**The standing question is: "Can we not do A, B, C?"** The agent always strives for the minimal change that achieves the thing, and it is the agent's job — not the driver's — to come up with concrete scope-cut suggestions: "We could ship this without the export feature and without per-user settings; that would let us test the core idea this round. Do we need them now?" Cutting scope is not laziness; it is how the core idea gets tested fast. Every cut is recorded as out-of-scope so it isn't lost, merely deferred.

Consistency with the rest of the system is a first-class criterion. A locally clever design that is alien to the codebase loses to a boring design that fits.

**Output:** `02-decisions.md` — options considered, the chosen one, and why the rejected ones were rejected.
**Gate:** the driver agrees with the decisions (explained in their language — see Working Modes).

### 3. Specify

_Goal: write down what will be true when the work is done. No code yet._

The spec describes **behavior**, not implementation: given/when/then scenarios, edge cases, error behavior — and, mandatorily, an **Out of Scope** section. What is explicitly _not_ being done this round (including everything cut during Challenge) is written down with the same care as what is. An empty out-of-scope section is a smell: it usually means the agent didn't try to cut anything. The spec must be understandable by the person driving. For a non-engineer, this means plain language about how the thing will _behave_ — never "we'll add a column to the table," always "the app will remember your last choice."

The spec is binding. During implementation, if code and spec disagree, the spec is either right (fix the code) or wrong (stop, revise the spec, get it re-approved). Code never silently wins.

**Output:** `03-spec.md`.
**Gate:** the driver explicitly approves the spec. This is the most important gate in the pipeline.

### 4. Plan and Budget

_Goal: cut the work into small pieces that can each be delivered quickly._

The agent decomposes the spec into tasks. Every task carries a **scope contract** — a small set of numbers written down before implementation starts:

| Metric                               | Role          | Limit                                                                                                             |
| ------------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Spec scenarios covered               | Planning unit | ≤ 3 per task                                                                                                      |
| Predicted files touched              | Planning unit | ~5 (estimate, written down)                                                                                       |
| Expected new tests                   | Planning unit | listed by name where possible                                                                                     |
| Open decisions carried into the task | Planning unit | **0** — unresolved questions go back to Challenge/Specify                                                         |
| Red–green cycles                     | Halt tripwire | if cycles climb well past the expected test count with no new tests passing, halt                                 |
| Actual diff shape vs. predicted      | Halt tripwire | plan said ~3 files, diff is at 10 → halt, regardless of anything else                                             |
| Token consumption                    | Hard backstop | ceiling per task (default set at adoption) — the only tripwire that catches _every_ failure mode, including loops |

The planning units are what humans reason about; the tripwires are what the agent watches while building. Deliberately, there are only two leading tripwires plus one backstop — the moment agents spend effort accounting for their accounting, the measurement is eating the work.

**If a task can't fit the contract at planning time, it must be split.** Being agile here means learning to cut scope: a task that can't be made small is a task that isn't understood yet, so it goes back through Challenge and Specify for its own slice.

**Output:** `04-plan.md` — the task list with scope contracts.
**Gate:** the driver approves the plan.

### 5. Build

_Goal: implement, test-first, within budget._

For each task:

1. **Red** — write the failing test that encodes the spec scenario.
2. **Green** — write the minimum code to pass.
3. **Refactor** — clean up while green, respecting Core/Shell, cohesion, and complexity limits.
4. **Mutate as you go.** Mutation testing is not saved up for CI. When a meaningful chunk of TDD work on a Core file is done — a task completed, or a few red–green cycles landed in the same file — the agent runs the mutator **scoped to that file (or those files)**. Single-file runs are fast. Surviving mutants mean the tests assert less than they claim; kill them now, while the context is loaded, not in a CI round-trip later.
5. **Verify at runtime.** Don't just trust the test suite's green light for behavior that spans the Shell — run the app, hit the endpoint, execute the migration against a scratch database, screenshot the component. Reality checks use deterministic tools, and their outputs are recorded.

While working, the agent thinks in text: it writes comments, notes, and running commentary freely. **That is scaffolding.** Before the task is marked done, the agent goes back and removes the slop — narration comments, "this function does X" restatements, dead exploration code. The standing rule: **if you think you need a comment, what you probably need is a good name and a good abstraction.** Try extracting a well-named function first; a comment survives only when it carries the _why_ that no name or structure could — a constraint from the outside world, a non-obvious trade-off, a warning.

**The lessons trigger:** whenever figuring something out took a detour — experiments, dead ends, an assumption the code contradicted — the agent jots one line in a lessons scratchpad inside the work docs. Jotting is cheap and indiscriminate on purpose; the ruthless filtering happens later, at Deliver. Capture now, judge later.

**The halt rule:** if any tripwire in the task's scope contract fires — red–green cycles climbing without progress, the diff outgrowing its predicted shape, or the token backstop — the agent **halts**. It does not push through. It returns to phase 4 with the new knowledge — what turned out to be harder and why — re-plans, re-splits, and restarts, reusing everything already learned and any code already proven by tests. Tripping a wire is not failure; ignoring it is.

**Output:** working code, passing tests, recorded runtime evidence in `05-verification.md`.
**Gate:** all tests pass, per-file mutation runs clean on touched Core files, scope contracts respected (or re-planned), evidence recorded.

### 6. Deliver

_Goal: a clean PR that an engineer can review quickly and trust._

The agent:

1. Runs the full local quality suite: lint, type checks, complexity, cycle detection, coverage, and mutation testing on the changed Core.
2. Sweeps the diff one final time for slop comments, leftover section comments, debug artifacts, and dead code.
3. Refines the `docs/work/<branch>/` artifacts into their final, readable form — these are now written _for the reviewing engineer_: what was asked, what was decided, what was verified and how.
4. Writes `06-lessons.md` — the **lessons learned** doc (see Documentation Lifecycle). This is the agent nominating candidates for permanence, not granting it.
5. Opens the PR. The PR description links the spec, summarizes decisions and evidence, and surfaces the lessons-learned candidates in their own clearly marked section so reviewers can't miss them.

**Gate:** CI green and engineer approval. Engineers review the code _and_ the ephemeral docs — the docs exist precisely so this review is fast and informed.

---

## Documentation Lifecycle

- **During work:** all pipeline artifacts live in `docs/work/<branch-name>/`. They are versioned, updated as understanding evolves, and honest — including records of halted budgets and revised specs.
- **In the PR:** the artifacts are part of the diff. Reviewers read them.
- **On merge:** a post-merge CI job deletes `docs/work/**` from the main branch automatically. No exceptions, no "let's keep this one."
- **In code:** comments explain _why_, never _what_. Section comments are banned in the Core. Narration comments do not survive phase 5. None of this is machine-checked — see CI: The Referee.

**The default fate of every document is erasure.** The agent never decides that a document is important enough to keep, never promotes it, never copies content into a permanent location "just in case." If something in the work docs turns out to be genuinely lasting, a **human** decides that — and does the extraction themselves, into the permanent, human-curated folder that CI does not auto-erase (e.g., `docs/` for README/ADRs). Persistence is a deliberate human act, never an agent's judgment call.

**The agent's job is to nominate, loudly.** In phase 6 it distills `06-lessons.md` — a short, ruthless list of candidates worth a human's attention before the folder is erased:

- surprises: things that worked differently than the code, docs, or common sense suggested;
- traps: mistakes made and corrected during this work that the next agent or engineer would plausibly repeat;
- decisions with long shadows: choices whose rationale will be asked about in six months and won't be recoverable from the code alone;
- spec-level insights: things learned about what the _product_ should do, surfaced in the driver's language.

Each entry says what the lesson is, why it might deserve to outlive the PR, and where it would live if kept (an ADR, a README section, a code comment, a test — often the best "doc" is a test). The bar is high: an empty lessons file is a perfectly good outcome, and padding it is slop. `06-lessons.md` is deleted on merge like everything else — the nomination survives only if a reviewing human acts on it, and the PR description points at it precisely so that decision happens _before_ the merge button, not after.

**How the scratchpad becomes the lessons file.** Capture is cheap; survival is expensive. During Build, anything that took a detour gets jotted (see the lessons trigger in phase 5). At Deliver, each jot faces one question: **would you tell this to the next agent before it starts, and would it change what they do?** No to either — delete it. Note that search cost alone is not the test: an expensive discovery can be worthless ("this codebase is large"), and a one-command discovery can be critical ("CI silently skips this directory").

And before nominating a lesson at all, check whether it's really **discoverability debt**: if something was expensive to figure out, the best fix is usually to make the _code_ teach it — rename the function, encode the surprise in a test, improve the error message — so nobody has to rediscover it, no doc required. A lesson that can be fixed in the diff belongs in the diff.

---

## Working Modes

### Engineer-driven

Engineers may drive the pipeline directly. They see the code, they may tighten or shortcut gates for trivial tasks (see Task Sizes), and they carry responsibility for the review either way.

### Vibe-coder-driven

Non-engineers drive through the Claude app: the agent clones the repo in the cloud, does the work, and the person interacts only with the deployed result. They will never open an editor and never read the code. The pipeline is what makes this safe. In this mode the agent must:

- **Translate everything into behavior language.** The driver doesn't know what a database is and doesn't need to. But the _logic_ of how the thing works must be clarified with them: "When two people edit the same item, whose change wins?" is their decision. "Postgres or SQLite?" is not their question.
- **Suggest the cuts.** The driver won't know what's expensive; the agent does. At every gate the agent proactively offers scope cuts in behavior language: "We can test the core idea this round without X and Y — want them later instead?" The minimal version that lets the driver _try the idea_ always goes first.
- **Never skip gates.** The driver approves exploration conclusions, decisions, the spec, and the plan — each presented plainly, with real questions where their input changes the outcome.
- **Surface the spec at every iteration.** Each "go another round" from the driver is a spec change first, code change second. The agent updates `03-spec.md`, confirms it, then implements.
- **Carry the full quality bar.** The absence of a human who reads the code raises, not lowers, the standard for tests, runtime verification, and CI compliance. The engineers reviewing the PR are the first humans to see this code; the docs must let them review it without a meeting.
- **Be honest at the boundary.** If the driver asks for something that violates the architecture rules or can't fit a budget, the agent says so in plain language and offers the closest thing that can be built well.

### Task Sizes

Not everything is a six-phase affair. Three tracks:

- **Full pipeline** — new features, architectural changes, non-trivial bugs, anything a vibe coder drives. All six phases.
- **Lightweight** — small known-pattern changes: phases collapse into a short combined note (`00-lite.md`: what, why, evidence), but TDD, budgets, and all CI gates still apply.
- **Trivial** — typo-level changes by engineers. CI still applies. Nothing merges on vibes.

The agent must state which track it is on and why. Choosing lightweight to save effort on something that deserved the full pipeline is a discipline violation.

---

## CI: The Referee

CI enforces everything that can be enforced deterministically. A red check is not a suggestion. The gate list below is stack-agnostic on purpose: concrete tools and thresholds are chosen per codebase through the Adoption process (next section) — every _chosen at adoption_ marker points there.

| Check                           | Scope                                       | Rule                                                                                          |
| ------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Build, lint, type check         | All                                         | Pass                                                                                          |
| Tests                           | All                                         | Pass                                                                                          |
| Line/branch coverage            | Core                                        | ≥ threshold (_chosen at adoption_)                                                            |
| Mutation score                  | Changed Core files in PR; full Core nightly | ≥ threshold (tool & % _chosen at adoption_)                                                   |
| Cyclomatic complexity           | All functions                               | < 10, hard fail                                                                               |
| Cumulative/cognitive complexity | Per file                                    | Soft gate, ratcheted (tool _chosen at adoption_)                                              |
| Dependency cycles               | All                                         | Zero, hard fail                                                                               |
| Stable Dependency Principle     | Modules                                     | No violation, hard fail                                                                       |
| Core purity                     | Core                                        | No imports from Shell/framework/I-O — effects only via injected functions/objects (hard fail) |
| Docs cleanup                    | Main branch                                 | Post-merge job deletes `docs/work/**`                                                         |

**What CI deliberately does not check.** Comment quality is not on the list, and the omission is on purpose. No pattern can distinguish a section comment or a narration comment from the rare comment that carries a genuine _why_ — the difference is whether an abstraction is missing, which is not a textual property. A check that catches only the decorated style (`// -- VALIDATION ----`) reports green on `// Validation`, and a green check that means nothing is worse than no check, because it launders an unreviewed file as reviewed. This rule is enforced by the agent's slop sweep at the end of phase 5 and by the engineer at phase 6. Prefer this outcome to a leaky gate whenever a rule resists deterministic checking: name it, assign it to a human, and leave CI out of it.

Mutation testing has three layers: the agent runs it **per-file during Build** (fast, immediate feedback), CI runs it on the **changed Core surface per PR** (keeps CI fast, catches anything the agent skipped), and a **full-Core nightly run** catches drift. By the time CI runs it, surviving mutants should already be dead.

---

## Adopting This Discipline in a Codebase

The rules above name _what_ is enforced; they deliberately do not name the tools. When this discipline is introduced into a codebase, tool selection is itself a pipeline task — engineer-driven, run once per repo (and re-run when the stack changes):

1. **Survey the stack.** Languages, frameworks, build system, existing CI, existing quality tooling already in place (don't duplicate what's there).
2. **Research candidates** for every enforcement point that needs a tool: dependency cycles and SDP, cyclomatic and cognitive complexity, cohesion metrics, coverage, mutation testing, Core-purity checking, and the docs-cleanup job. Research means current research — what's maintained _now_, what supports this stack's versions — not recalling names from memory.
3. **Verify by running, not by reading.** Each shortlisted tool is actually installed and executed against this repo — does it run in this build, how long does it take, what does it flag on the current code, can its output gate CI? A tool that looks right in its README and chokes on the repo is disqualified by the experiment, not the eyeball.
4. **Propose a shortlist with trade-offs** in a work doc: per enforcement point, the recommended tool, the runner-up, speed and integration cost, and what the current codebase scores.
5. **Humans choose.** Engineers pick the tools and set the initial thresholds. Numeric gates (coverage, mutation, cognitive complexity) start lenient — anchored to what the codebase scores _today_ — and **ratchet**: the threshold may rise as the code improves, never fall. A ratchet turns every improvement into a floor.
6. **Wire it and delete the scaffolding.** The chosen tools go into CI config (which is code — the permanent truth); the research doc dies with its PR like any other work doc. The chosen thresholds live in config, not in this document.

The same process fills the non-CI blanks: the token backstop default (start generous, tighten with halt-rate data), and the churn-audit cadence (start with what the team can sustain, adjust with volume).

---

## Periodic Audits (Human-Led)

Some signals are about the history of the code, not its current state — ideas from _Your Code as a Crime Scene_:

- **Hotspots:** files with both high churn and high complexity are where the next bug lives. Reviewed regularly; refactoring hotspots is scheduled work, not a side quest.
- **Change coupling:** files that keep changing in the same commits without an explicit dependency reveal hidden coupling. Investigated and either made explicit or severed.
- **Churn rate:** with AI, volume is up, so auditing churn is a routine chore now, done more often than pre-AI habit suggests (cadence set at adoption).

Humans make the calls here. The agent's duty is awareness: it should notice when it is working inside a known hotspot, say so in `01-exploration.md`, and bias toward smaller, safer steps there.

---

## The Full Cycle

```
Explore → Challenge → Specify → Plan & Budget → Build → Deliver
   │          │           │            │           │        │
Understanding Decisions  Spec        Tasks +     Code +   Clean PR,
 confirmed    approved  approved     budgets     evidence  CI green,
                                     approved              engineer
                                                           approval
                                                              │
                                                           MERGE
                                                              │
                                                   docs/work/** deleted
```

Code stays. Scaffolding goes. CI decides.

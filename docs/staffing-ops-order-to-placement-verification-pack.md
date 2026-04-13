# Staffing Ops Order-to-Placement Verification Pack

## Purpose

- Freeze the merge-review evidence bar for the first writable thin slice:
  - order intake
  - candidate readiness
  - assignment commit
- Give reviewers of [CMPAAAAAAAA-37](/CMPAAAAAAAA/issues/CMPAAAAAAAA-37) and [CMPAAAAAAAA-38](/CMPAAAAAAAA/issues/CMPAAAAAAAA-38) one shared pass/fail checklist.
- Separate what the repository proves today from what still requires explicit manual evidence before pilot entry.

## Slice In Scope

- `Order` can move from intake into a staffing-ready state with required commercial and site fields present.
- The placement surface shows candidate readiness and blocker reasons before commit.
- Assignment commit creates a stable snapshot of schedule and rate inputs.
- Blocked candidates stay blocked unless an override reason is captured explicitly.
- Review evidence links backend state change to operator-visible status changes.

## Mandatory Branch Gate

Every branch that claims to implement or change this slice must provide:

1. `pnpm check`
2. `pnpm validate:branch`
3. `pnpm validate:pr "<pr-title>" "<pr-body>"` once PR metadata exists
4. thin-slice scenario evidence from the matrix below
5. explicit note of any remaining gap that is not covered by automation

If one of the commands above cannot run yet because the branch is still scaffold-level, the PR is not review-ready until the gap is called out in risk notes and equivalent evidence is attached manually.

## Scenario Matrix

### 1. Happy Path

**Goal**

- prove that one order can move from staffing-ready demand into a committed assignment without losing snapshot integrity

**Pass criteria**

- order is visible as staffing-ready before commit
- at least one candidate is clearly placeable
- commit creates an assignment snapshot with pay rate, bill rate, shift pattern, and effective date
- order fill count or queue summary changes after commit
- reviewer can correlate order id and assignment id across evidence

**Fail conditions**

- commit mutates state without snapshot proof
- commit succeeds while required commercial fields or readiness gates are still ambiguous
- post-commit order status or remaining headcount is not visible

**Required evidence**

- terminal trace, scripted proof, or automated test output showing pre-commit and post-commit state
- one desktop capture of the order in `Demand` or `Placement`
- one capture showing the committed state or updated queue summary

### 2. Blocked Path

**Goal**

- prove that qualification, document, or availability blockers stop assignment commit

**Pass criteria**

- the blocked candidate is visibly marked before commit
- blocker reason is legible and tied to a concrete readiness category
- blocked commit does not create an assignment or advance order fill counts
- reviewer can tell whether the failure came from missing docs, qualification review, or availability

**Fail conditions**

- blocked state appears only after a failed commit attempt with no pre-commit warning
- blocker is generic or not actionable
- failed commit still mutates assignment, audit, or order counters

**Required evidence**

- placement-board capture with blocker badge and reason visible
- terminal trace or automated assertion proving no assignment was committed
- risk note if the branch still relies on seeded data instead of persisted state

### 3. Override Path

**Goal**

- prove that the branch distinguishes a normal commit from an override and forces typed justification

**Pass criteria**

- default commit path remains blocked for the candidate in question
- override path requires explicit reason text and actor identity
- resulting state is distinguishable from a normal assignment commit
- override reason is preserved in audit or event evidence

**Fail conditions**

- override is functionally identical to a normal confirm button
- override reason is optional, lossy, or not reviewable afterward
- reviewer cannot identify who authorized the override

**Required evidence**

- capture or trace of the blocked candidate before override
- capture or trace of override input with reason present
- audit payload or event proof showing the override reason and actor

### 4. Audit And Reviewability Path

**Goal**

- prove that a reviewer can reconstruct who changed what and why

**Pass criteria**

- state-changing evidence includes `actor`, `timestamp`, `entity`, `action`, and `reason` when applicable
- order id, assignment id, and worker id can be correlated across the proof set
- reviewer can distinguish between normal commit and override evidence

**Fail conditions**

- screenshots or logs show only the end state
- timestamps or actors are missing
- audit output cannot be tied back to the specific order or assignment under review

**Required evidence**

- audit record screenshot, terminal dump, or structured payload
- one reviewer note explaining how the evidence maps back to the exact thin-slice scenario

## PR-Specific Review Expectations

### For [CMPAAAAAAAA-37](/CMPAAAAAAAA/issues/CMPAAAAAAAA-37)

Backend review is not complete until the PR shows:

- clean-database proof that the workflow tables and uniqueness contracts exist
- deterministic order-to-assignment trace, not just static type coverage
- blocked-placement proof for at least one readiness failure
- override proof with typed reason preserved
- audit proof for assignment commit and override
- `pnpm check` output attached or pasted into the PR

Acceptable evidence sources for this branch:

- `packages/db/test/migration.test.ts`
- `packages/domain/test/index.test.ts`
- `packages/jobs/test/outbox.test.ts`
- one additional scripted or automated trace that proves order-to-placement state change end to end

Evidence is insufficient if the PR only shows snapshot helpers without the order and commit transition around them.

### For [CMPAAAAAAAA-38](/CMPAAAAAAAA/issues/CMPAAAAAAAA-38)

Frontend review is not complete until the PR shows:

- `Demand` view with an order that is staffing-ready
- `Demand` intake state with a blocked commercial publish example
- `Placement` view with one ready candidate and one blocked candidate
- clear distinction between normal confirm and override interaction
- post-commit visible change in queue summary, order chip, or placement status
- responsive proof for the operator desktop surface, and mobile proof only if the branch touches site-lead flow or shared status vocabulary

Acceptable evidence sources for this branch:

- `tests/integration/admin-shell.test.ts`
- render output or screenshots from the seeded admin shell
- one short capture proving before/after state for commit or override

Evidence is insufficient if the PR only shows seeded navigation without the placement decision states and resulting status change.

## Current Automated Coverage Map

| Existing proof | What it proves today | Thin-slice review value | Remaining gap |
| --- | --- | --- | --- |
| `packages/db/test/migration.test.ts` | core workflow tables and uniqueness constraints exist in the initial migration | partial backend baseline | does not prove order create, placement block, override, or audit persistence |
| `packages/domain/test/index.test.ts` | assignment snapshots reject invalid rates; attendance approval creates auditable invoice trigger | adjacent workflow contract | does not prove order-to-placement happy path, blocked path, or override |
| `packages/jobs/test/outbox.test.ts` | invoice draft outbox jobs use an attendance-based dedupe key | downstream idempotency baseline | outside the order-to-placement slice itself |
| `tests/integration/repo-contracts.test.ts` | admin, API, DB, jobs, and domain manifests stay aligned | repository contract baseline | does not prove real thin-slice state transitions |
| `tests/integration/admin-shell.test.ts` | seeded operator navigation and route rendering exist | partial frontend surface proof | no stateful commit, block, or override interaction coverage |

## Evidence Package Format

When attaching thin-slice proof to a PR, include the following in this order:

1. command output:
   - `pnpm check`
   - any branch-specific trace command
2. backend proof:
   - happy path
   - blocked path
   - override path
   - audit path
3. frontend proof:
   - `Demand`
   - `Placement`
   - post-commit state
4. risk notes:
   - what is still seeded or non-persistent
   - what still requires manual QA

## Remaining Gaps Before Pilot Entry

The thin slice can be merge-reviewed with explicit evidence before these are closed, but pilot entry remains blocked until they are resolved:

- no persisted end-to-end automated test currently proves `order create -> placement block or override -> assignment commit`
- no automated assertion currently proves override reason retention in audit storage
- no UI automation currently proves commit changes queue summary or order status in a stateful runtime
- no role-boundary proof currently shows who is allowed to perform override
- no repeatable evidence standard yet exists for querying audit history from a real runtime environment

## Release Decision Rule

- Merge review for [CMPAAAAAAAA-37](/CMPAAAAAAAA/issues/CMPAAAAAAAA-37) and [CMPAAAAAAAA-38](/CMPAAAAAAAA/issues/CMPAAAAAAAA-38) may proceed only when this pack is satisfied with explicit evidence.
- Pilot readiness does not inherit from merge readiness.
- Any PR that satisfies this pack while still depending on seeded or manual proof must say so explicitly in the risk notes.

# Staffing Ops Attendance-to-Billing Verification Pack

## Purpose

- Freeze the merge-review evidence bar for the first writable `attendance approval -> invoice handoff` slice.
- Give reviewers of [CMPAAAAAAAA-40](/CMPAAAAAAAA/issues/CMPAAAAAAAA-40) and [CMPAAAAAAAA-41](/CMPAAAAAAAA/issues/CMPAAAAAAAA-41) one shared pass/fail checklist.
- Separate what the repository proves today from what still requires explicit manual evidence before pilot entry.

## Slice In Scope

- submitted attendance can be approved only when the row is finance-ready
- corrected attendance can be re-approved without losing original source context
- incomplete or invalid attendance stays blocked from billing handoff
- approval emits audit evidence plus an invoice draft request and outbox job
- operator surfaces show the difference between approval-blocked and handoff-ready billing work

## Mandatory Branch Gate

Every branch that claims to implement or change this slice must provide:

1. `pnpm check`
2. `pnpm validate:branch`
3. `pnpm validate:pr "[ISSUE-ID] summary" "<pr-body>"` once PR metadata exists
4. thin-slice scenario evidence from the matrix below
5. explicit note of any remaining billing-risk gap that is not covered by automation

If validation is run from a shared QA workspace that is still on `main`, the branch-governance commands must be rerun from the feature branch before merge approval.

The PR metadata rerun must include:

- `## Linked Paperclip Issue`
- `## Summary`
- `## Risk Notes`
- `## Verification Notes`
- one linked Paperclip issue path such as `/CMPAAAAAAAA/issues/CMPAAAAAAAA-52`

## Scenario Matrix

### 1. Happy Path

**Goal**

- prove that one submitted attendance row can move into approved state and make finance handoff readiness visible

**Pass criteria**

- attendance moves from `submitted` to `approved`
- approval creates an audit event tied to the attendance row
- approval creates an invoice draft request and outbox job
- billing surface or queue evidence shows the row as handoff-ready rather than approval-blocked
- reviewer can correlate assignment id, attendance id, client/site context, and billing period across the proof set

**Fail conditions**

- approval succeeds while actual start or end time is still missing
- approval changes only the row state but leaves no downstream handoff evidence
- reviewer cannot correlate the attendance row back to its assignment or billing period

**Required evidence**

- terminal trace or automated test output showing pre-approval and post-approval state
- one capture of the attendance queue before approval
- one capture of the billing queue or draft after approval
- structured audit or outbox payload proof

### 2. Correction And Re-Approval Path

**Goal**

- prove that a corrected row can be re-approved without losing original values or correction context

**Pass criteria**

- corrected attendance is visibly distinct from clean submitted attendance before approval
- original versus corrected values remain reviewable
- typed reason or evidence for the correction is visible in the proof set
- re-approval creates reviewable audit evidence that is distinguishable from the first approval

**Fail conditions**

- corrected rows bypass approval with no explicit re-approval step
- original submitted values disappear once the correction is applied
- correction reason is optional, lossy, or impossible to review later

**Required evidence**

- corrected-row capture showing original versus corrected context
- terminal trace or automated assertion proving re-approval succeeds only after correction state exists
- audit proof showing actor and correction-related context

### 3. Blocked Path

**Goal**

- prove that incomplete or invalid attendance cannot cross into invoice handoff

**Pass criteria**

- rows in `captured`, `exception_pending`, or `site_review_pending` remain blocked from approval
- invalid approvals fail with an actionable reason
- billing evidence still shows an `approval_blocked` state when unresolved rows remain
- blocked path does not create invoice draft requests or outbox jobs

**Fail conditions**

- a row without complete actuals can be approved
- blocked rows silently appear in billing handoff
- reviewer sees a billing blocker but cannot tell which attendance condition caused it

**Required evidence**

- negative test output or terminal trace for invalid approval attempts
- attendance queue capture with the blocker visible
- billing queue capture showing the unresolved blocker

### 4. Audit And Outbox Path

**Goal**

- prove that a reviewer can reconstruct who approved what and what downstream payload was emitted

**Pass criteria**

- audit proof includes `actor`, `timestamp`, `entity`, and `action`
- invoice draft request proof includes organization, client, site, worker, source assignment, source attendance, billing period, bill rate, and request time
- outbox proof shows the billing topic and a stable dedupe key anchored on the attendance row
- reviewer can distinguish a normal approval from a correction-related approval

**Fail conditions**

- payload proof lacks the keys finance needs to trace the handoff source
- approval actor is missing or not human-reviewable
- corrected-row reason is not preserved anywhere reviewable

**Required evidence**

- audit payload or structured log dump
- invoice draft request payload dump
- outbox job payload or assertion proving topic and dedupe key

## PR-Specific Review Expectations

### For [CMPAAAAAAAA-40](/CMPAAAAAAAA/issues/CMPAAAAAAAA-40)

Backend review is not complete until the PR shows:

- clean-database or schema proof for attendance and outbox readiness
- happy-path approval proof from `submitted` to invoice draft request
- corrected-row re-approval proof
- blocked approval proof for invalid status or incomplete actual window
- audit proof for approval actor and timing
- outbox payload proof with finance handoff keys
- `pnpm check` output attached or pasted into the PR

Acceptable evidence sources for this branch:

- `packages/db/test/migration.test.ts`
- `packages/domain/test/index.test.ts`
- `packages/jobs/test/outbox.test.ts`
- `tests/integration/repo-contracts.test.ts`
- one additional scripted or automated trace if existing tests do not cover corrected-row re-approval

Evidence is insufficient if the PR only shows a successful approval contract without a blocked path and corrected-row proof.

### For [CMPAAAAAAAA-41](/CMPAAAAAAAA/issues/CMPAAAAAAAA-41)

Frontend review is not complete until the PR shows:

- `Attendance` surface with clean, corrected, and blocked rows distinguished clearly
- visible approval action for clean rows and clear non-approve handling for blocked rows
- `Billing` surface with both `ready_for_handoff` and `approval_blocked` states
- before/after proof that approval changes queue or billing readiness state
- trace-back from billing line items to attendance source and assignment context
- desktop proof for the operator surface, plus mobile proof only if the branch changes site-lead flow or shared status vocabulary

Acceptable evidence sources for this branch:

- `tests/integration/admin-shell.test.ts`
- render output or screenshots from the seeded admin shell
- one interactive proof, automated or manual, that shows attendance approval changing billing readiness

Evidence is insufficient if the PR only shows static attendance and billing screens with no approval-state transition.

## Current Automated Coverage Map

| Existing proof | What it proves today | Thin-slice review value | Remaining gap |
| --- | --- | --- | --- |
| `packages/db/test/migration.test.ts` | attendance status enum and outbox uniqueness contracts exist in the initial migration | schema baseline | does not prove approval transitions, billing blockers, or emitted payloads |
| `packages/domain/test/index.test.ts` | submitted attendance can become approved, corrected rows can be re-approved, invalid status is rejected, and finance handoff exports approved rows only | strong backend contract | still in-memory proof only |
| `packages/jobs/test/outbox.test.ts` | invoice draft outbox jobs dedupe on `sourceAttendanceId` | downstream idempotency baseline | does not prove payload completeness or delivery handling |
| `tests/integration/repo-contracts.test.ts` | attendance approval envelopes keep audit and outbox wiring aligned across packages | cross-package contract baseline | does not prove persisted state or queue mutation in a runtime |
| `tests/integration/pilot-proof-fixture.test.ts` | one named fixture proves approved-only export rows and blocked-row exclusion on a stable batch trace | persisted finance-handoff proof | does not prove a live runtime queue |
| `tests/integration/admin-shell.test.ts` | attendance and billing surfaces render with seeded copy | partial frontend surface proof | no operator action or before/after approval proof |
| `tests/integration/admin-flow.test.ts` | demand publish, placement override, attendance approval, blocked billing proof, and billing-state transition stay interactive | strong review-surface proof | seeded UI evidence still needs feature-branch rerun output for release gating |

## Manual Evidence Checklist

- `pnpm check` output
- `pnpm validate:branch` output from the feature branch
- `pnpm validate:pr` output once PR metadata exists, including linked issue, risk notes, and verification notes
- happy-path attendance approval trace
- corrected-row re-approval trace
- blocked-row trace for invalid or incomplete attendance
- billing queue or draft capture before and after approval
- audit payload showing actor and approval time
- invoice draft request and outbox payload showing downstream keys
- explicit risk note for any seeded, non-persistent, or manual-only proof

## Remaining Gaps Before Pilot Entry

The thin slice can be merge-reviewed with explicit evidence before these are closed, but pilot entry remains blocked until they are resolved:

- no test currently proves approval is blocked when actual start or end time is missing
- no persisted runtime audit replay yet shows correction reason outside seeded or test-owned proof
- no role-boundary proof yet shows who may approve, correct, or export attendance-linked billing work
- branch-governance proof is not satisfied in the shared QA workspace because validation currently runs on `main`

## Release Decision Rule

- Merge review for [CMPAAAAAAAA-40](/CMPAAAAAAAA/issues/CMPAAAAAAAA-40) and [CMPAAAAAAAA-41](/CMPAAAAAAAA/issues/CMPAAAAAAAA-41) may proceed only when this pack is satisfied with explicit evidence.
- The current repository baseline is strong enough for partial backend contract review, but not yet for full attendance-to-billing sign-off.
- Pilot readiness does not inherit from merge readiness.
- Any PR that satisfies this pack while still depending on seeded or manual proof must say so explicitly in the risk notes.

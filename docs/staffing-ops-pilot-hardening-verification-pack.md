# Staffing Ops Pilot Hardening Verification Pack

## Purpose

- Freeze the evidence bar for moving from seeded or demo proof into pilot-reviewable proof.
- Connect the existing thin-slice verification packs into one end-to-end gate for `order -> placement -> attendance -> billing`.
- Give QA, CTO, backend, frontend, and pilot reviewers one reproducible checklist for what must be proven before pilot entry.

## Applies To

- `docs/staffing-ops-order-to-placement-verification-pack.md`
- `docs/staffing-ops-attendance-to-billing-verification-pack.md`
- [CMPAAAAAAAA-43](/CMPAAAAAAAA/issues/CMPAAAAAAAA-43): spreadsheet-first finance handoff export contract
- [CMPAAAAAAAA-44](/CMPAAAAAAAA/issues/CMPAAAAAAAA-44): audit timeline and billing review surface
- any branch, release ticket, or pilot review that claims the staffing workflow is ready for operator use beyond seeded shell proof

## Pilot Hardening Principles

- Persisted runtime proof outranks seeded shell proof.
- One fixture must support the entire flow so reviewers can correlate `order`, `assignment`, `attendance`, `audit`, and `export batch` identifiers without guesswork.
- Spreadsheet-first finance handoff is not proven until a real reviewable export artifact or artifact-equivalent payload exists.
- Override and correction flows are not proven until both storage-level proof and operator-visible review proof exist.
- Merge-ready proof is not automatically pilot-ready proof.

## Required Pilot Fixture

The pilot evidence pack must run against one named fixture or seed bundle that contains all of the following:

- one client account and one site with finance-ready billing metadata
- one order that can publish cleanly into staffing-ready state
- one placeable worker
- one blocked worker that requires an explicit override
- one confirmed assignment linked to the published order
- one clean submitted attendance row that can be approved
- one corrected attendance row that requires re-approval
- one blocked attendance row that must stay out of billing handoff
- one invoice draft or export batch generated from approved attendance only

If a review uses multiple unrelated fixtures or screenshots from different states, it is not pilot-reviewable.

## Reproducible Run Envelope

Every pilot verification run must archive the following metadata before reviewers look at screenshots or payloads:

1. git commit SHA and branch name
2. fixture or seed identifier
3. environment name and timezone
4. operator roles used during the run
5. command output for:
   - `pnpm check`
   - `pnpm validate:branch`
   - `pnpm validate:pr "[ISSUE-ID] summary" "<pr-body>"` once PR metadata exists

When running `pnpm validate:pr`, the PR body must include all of the following:

- `## Linked Paperclip Issue`
- `## Summary`
- `## Risk Notes`
- `## Verification Notes`
- one linked Paperclip issue path such as `/CMPAAAAAAAA/issues/CMPAAAAAAAA-52`

If a command cannot run from the review workspace, the evidence pack must say why and point to the exact branch or environment where it was rerun successfully.

## End-to-End Scenario Matrix

### 1. Happy Path: Order To Export

**Goal**

- prove that one staffing-ready order can move through placement, attendance approval, and finance handoff export without spreadsheet re-entry

**Pass criteria**

- order publishes into staffing-ready state with required commercial and qualification fields present
- placement commit creates a traceable assignment snapshot
- attendance approval creates audit proof plus invoice draft or export request proof
- billing handoff produces a reviewable export artifact or payload tied to the approved attendance row
- reviewer can correlate `orderId`, `assignmentId`, `attendanceId`, and `exportBatchId`

**Fail conditions**

- any downstream state is shown without a stable upstream identifier
- billing proof exists only as a queue label with no export artifact or export-shaped payload
- the flow requires spreadsheet re-entry or manual reconstruction between approval and handoff

**Required evidence**

- terminal trace or automated output for publish, commit, approval, and export generation
- one desktop capture for `Demand` or `Placement`
- one capture for `Attendance` or `Billing`
- structured export payload or artifact preview with batch metadata

### 2. Placement Blocker And Override Path

**Goal**

- prove that blocked placement is reviewable before commit and that overrides remain reconstructable afterward

**Pass criteria**

- blocked candidate is visibly marked before commit
- normal commit path stays blocked until explicit override reason is provided
- override actor, timestamp, and reason persist in audit evidence
- operator review surface can show the override context after the commit

**Fail conditions**

- override reason exists only in transient UI state
- reviewer can see the final assignment but not the blocked precondition
- audit output cannot distinguish a normal commit from an override

**Required evidence**

- blocked-state capture before override
- override submission capture or trace with typed reason
- persisted audit payload or query result showing actor, timestamp, before or after context, and reason
- UI review capture tied to the same assignment

### 3. Attendance Correction And Re-Approval Path

**Goal**

- prove that attendance corrections remain reviewable from original values through re-approval and finance handoff

**Pass criteria**

- corrected attendance is distinguishable from a clean submitted row
- original versus corrected values remain visible in review evidence
- correction reason is typed and preserved
- re-approval creates a second reviewable audit event and a finance handoff event anchored on the same source attendance row

**Fail conditions**

- correction overwrites the original context
- correction reason is missing from persisted audit evidence
- re-approval is implied but not reviewable as a distinct action

**Required evidence**

- corrected-row queue capture before re-approval
- terminal trace or automated assertion proving correction then re-approval
- audit payload showing original status, corrected values, approver, and timing
- billing or export proof showing the corrected row is the one handed off

### 4. Blocked Attendance To Billing Path

**Goal**

- prove that incomplete or invalid attendance cannot leak into finance handoff

**Pass criteria**

- blocked attendance rows remain visibly blocked in the attendance queue
- billing review or export preparation shows the unresolved blocker clearly
- no export artifact or export-shaped payload is generated for blocked rows

**Fail conditions**

- blocked attendance appears in billing-ready or export-ready state
- reviewer sees a blocked billing state without knowing which attendance row caused it
- negative path is proven only by static copy, not by a failed state transition or missing payload

**Required evidence**

- negative approval or export trace
- attendance queue capture with blocker visible
- billing review capture showing the blocked state
- proof that no export batch entry was generated for the blocked row

### 5. Persisted Audit Reconstruction Path

**Goal**

- prove that a reviewer can reconstruct the whole workflow from persisted audit and review surfaces rather than from test-only in-memory objects

**Pass criteria**

- audit history exposes `actor`, `timestamp`, `entity`, `action`, and meaningful before or after deltas where applicable
- export review shows batch summary plus source trace back to attendance and assignment
- operator-facing review surface can display placement override, attendance correction, and billing handoff context
- reviewer can navigate from UI proof to persisted payload proof for the same identifiers

**Fail conditions**

- proof set relies only on unit test object snapshots
- audit exists in logs but is not reviewable from the product surface
- batch summary and source trace cannot be tied together

**Required evidence**

- persisted audit query, dump, or timeline screenshot
- operator shell capture for the review surface
- export batch summary or artifact preview with source trace fields

## Current Automated Baseline

| Existing proof | What it proves today | Pilot-hardening value | What it does not prove |
| --- | --- | --- | --- |
| `packages/db/test/migration.test.ts` | core tables and uniqueness contracts for attendance and outbox exist | schema baseline | no persisted workflow run, no export artifact generation, no audit retrieval |
| `packages/domain/test/index.test.ts` | order publish, worker eligibility blockers, placement override, attendance submit, attendance correction, attendance re-approval, and finance handoff contracts behave in memory | strong domain contract baseline | no persisted store and no operator review surface by itself |
| `packages/jobs/test/outbox.test.ts` | invoice draft outbox jobs anchor dedupe on approved attendance | idempotency baseline | no proof of export batch shape, no delivery or archive artifact |
| `tests/integration/repo-contracts.test.ts` | API envelopes keep order, attendance, audit, and outbox wiring aligned across packages | cross-package continuity baseline | no runtime queue mutation and no full operator review surface |
| `tests/integration/pilot-proof-fixture.test.ts` | one named fixture produces approved-only export rows, blocked-row exclusion, and stable `exportBatchId` trace on one dataset | persisted pilot-proof baseline | no operator review surface playback |
| `tests/integration/admin-flow.test.ts` | placement override, attendance approval, and billing-state transition stay interactive in the seeded admin flow | review-surface proof for blocked vs ready billing states | seeded UI proof is still separate from the persisted proof fixture |
| `tests/integration/admin-shell.test.ts` | seeded attendance, billing, and mobile roster surfaces render with expected entry points and identifier trace panels | static review-surface baseline | no unstable-network or permission-boundary proof |

## Automation Boundary

Treat the current repository as sufficient for merge-oriented contract review, but not for pilot sign-off.

What the repo proves automatically today:

- core state transitions exist at the domain layer
- audit and outbox envelopes are wired consistently
- one named persisted fixture can prove approved-only export with blocked attendance exclusion
- the operator shell exposes mixed-state billing review surfaces with source identifiers
- placement override and attendance approval behavior are interactively represented in the seeded admin flow

What still requires explicit pilot evidence:

- one release-ticket rerun from the real feature branch and real PR context
- mobile retry and evidence-upload recovery under unstable network conditions
- role-boundary permission enforcement proof

## Review Requirements For The Open Pilot Gaps

### For [CMPAAAAAAAA-43](/CMPAAAAAAAA/issues/CMPAAAAAAAA-43)

Pilot review is not complete until the evidence pack shows:

- a generated spreadsheet-friendly export artifact, preview, or payload with a stable `exportBatchId`
- source attendance ids and source assignment snapshot references inside the export proof
- generated time and actor context tied to the same batch key as the audit and outbox proof
- proof that blocked or unapproved attendance is excluded from the export batch

Unit and outbox tests are necessary but not sufficient here. Pilot reviewers need batch-level traceability, not just request creation.

### For [CMPAAAAAAAA-44](/CMPAAAAAAAA/issues/CMPAAAAAAAA-44)

Pilot review is not complete until the evidence pack shows:

- placement override review context in the operator surface
- attendance correction and re-approval review context in the operator surface
- billing review context that exposes batch summary and source trace back to attendance and assignment
- the same identifiers visible in UI proof and persisted audit or export proof

Seeded shell rendering is necessary but not sufficient here. Pilot reviewers need reviewable audit context tied to real workflow data.

## Evidence Archive Format

Archive pilot evidence in this order:

1. run envelope metadata
2. command output
3. fixture description
4. end-to-end happy-path proof
5. blocker and override proof
6. correction and re-approval proof
7. export artifact or export payload proof
8. persisted audit and review-surface proof
9. residual risk notes

If any item above is missing, the pack must explicitly call the gap a pilot blocker.

## Prioritized Pilot Blockers

### P0 blockers

- no current repo-level P0 artifact blocker remains after [CMPAAAAAAAA-47](/CMPAAAAAAAA/issues/CMPAAAAAAAA-47) and [CMPAAAAAAAA-48](/CMPAAAAAAAA/issues/CMPAAAAAAAA-48)
- release approval still requires a real feature-branch rerun and a real PR metadata rerun before this can be treated as final sign-off evidence

### P1 blockers

- no role-boundary proof currently shows who may override placement, correct attendance, and export billing artifacts
- no mobile retry and evidence-upload recovery proof is archived on an unstable network profile
- mixed-state billing is now archived in `docs/staffing-ops-correlated-pilot-evidence-archive.md` and is no longer an open standalone proof gap

### P2 blockers

- no standardized fixture naming and archive convention exists yet for future pilot reruns
- branch-governance proof may still be produced from a shared QA workspace instead of the feature branch unless the release ticket attaches rerun output from the actual branch

## Release Decision Rule

- The existing thin-slice packs can approve merge review with explicit risk notes.
- Pilot entry is blocked until this document is satisfied on one persisted fixture with one correlated evidence set.
- If a proof item depends on seeded shell output, it must be labeled as merge-only evidence, not pilot evidence.

# Staffing Operations QA and Release Gate

## Purpose

- Define the merge and release-quality gate for the first `internal operations OS` implementation loop.
- Convert the P0 acceptance criteria from [CMPAAAAAAAA-22](/CMPAAAAAAAA/issues/CMPAAAAAAAA-22) into reproducible verification, UAT, and evidence requirements.
- Give CTO, PM, backend, frontend, and QA one shared checklist before pilot-facing rollout.

## Applies To

- [CMPAAAAAAAA-34](/CMPAAAAAAAA/issues/CMPAAAAAAAA-34): backend foundation, schema skeleton, domain boundaries, audit/outbox contracts
- [CMPAAAAAAAA-35](/CMPAAAAAAAA/issues/CMPAAAAAAAA-35): operator shell, P0 workflow screens, responsive site-lead mobile surface
- `docs/staffing-ops-order-to-placement-verification-pack.md`: merge-review proof pack for [CMPAAAAAAAA-37](/CMPAAAAAAAA/issues/CMPAAAAAAAA-37) and [CMPAAAAAAAA-38](/CMPAAAAAAAA/issues/CMPAAAAAAAA-38)
- `docs/staffing-ops-attendance-to-billing-verification-pack.md`: merge-review proof pack for [CMPAAAAAAAA-40](/CMPAAAAAAAA/issues/CMPAAAAAAAA-40) and [CMPAAAAAAAA-41](/CMPAAAAAAAA/issues/CMPAAAAAAAA-41)
- Any PR that changes `Order -> Assignment -> Attendance -> Invoice handoff` behavior or the supporting audit / evidence path

## Gate Levels

### 1. Workflow-Critical PR Merge Gate

All workflow-critical PRs must satisfy every item below before merge:

- GitHub governance passes:
  - branch name matches `<ISSUE-ID>/<short-kebab-title>`
  - PR title matches `[<ISSUE-ID>] <summary>`
  - PR body includes linked Paperclip issue, summary, risk notes, and verification notes
- CI is green:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
- The PR includes evidence for the workflow it changes:
  - terminal output or screenshots for the verification commands that matter
  - screenshots or recording for changed operator/mobile flows
  - explicit risk note covering workflow, data, or operational regression risk
- No unresolved P0 defect remains in the changed flow for:
  - order readiness
  - worker qualification gate
  - placement status visibility
  - attendance correction traceability
  - invoice handoff eligibility
  - audit event integrity

### 2. Pilot Entry Gate

Pilot rollout is blocked until all of the following are true:

- All six UAT scenarios in this document pass end to end.
- Role boundary checks pass for `Operations Coordinator`, `Operations Manager`, `Site Lead Mobile`, and `Finance Admin`.
- Audit trail checks pass for every critical state-changing action listed in this document.
- Mobile retry and photo-upload recovery are demonstrated under unstable-network conditions.
- Approved attendance can reach invoice handoff without spreadsheet re-entry.
- Evidence is archived in the release ticket or linked PR set.

## Current Automated Baseline

Today the repository only provides a scaffold-level safety net. Treat it as a baseline, not as pilot-ready coverage.

- `packages/domain/test/index.test.ts`
  - verifies `createAssignmentSnapshot` freezes billing/payroll values into a versioned snapshot
  - rejects non-positive rates so invalid invoice math cannot start
- `tests/integration/repo-contracts.test.ts`
  - verifies the admin shell, API shell, and shared domain profile stay aligned to the Korea-only operating model
- Repository automation
  - `.github/workflows/ci.yml` enforces lint, typecheck, unit, integration, and build
  - `.github/workflows/pull-request-governance.yml` enforces branch and PR metadata conventions

## Known Coverage Gaps

These gaps must be covered by new automation or by explicit PR/UAT evidence before pilot release:

- No end-to-end flow test exists yet for `Order -> Placement -> Attendance -> Billing`.
- No automated role-permission test exists yet.
- No audit-event persistence test exists yet.
- No mobile retry or photo-upload recovery automation exists yet.
- No invoice handoff contract/export verification exists yet.

## P0 Acceptance Checklist

Each criterion below must be verified with evidence before pilot entry.

| Acceptance target | Verification method | Required evidence |
| --- | --- | --- |
| One order record carries `client/site/role/shift/headcount/rate/required documents` through placement, attendance, and billing handoff | Seed one order and trace its ID through all downstream records | screenshot or terminal trace showing shared identifiers |
| Worker placement is blocked or explicitly overridden when qualifications, document validity, availability, or recent assignment history fail | execute both pass and fail placement paths | blocked-state capture plus override reason capture |
| Placement board statuses `confirmed / pending / unfilled / gap` match mobile roster vocabulary | compare desktop board and site-lead mobile roster on the same dataset | paired screenshots from desktop and mobile views |
| Site lead mobile can access `today roster`, `check-in/out`, `replacement request`, and `evidence upload` | complete each action in a seeded/mobile test run | short screen recording or screenshot set |
| Operator can resolve `no-show`, `late arrival`, `overtime`, `replacement`, `attendance cutoff miss`, `retro correction`, and `billing dispute` from queue-driven workflows | run queue resolution on each exception type | queue screenshot before and after resolution, with notes |
| Only approved attendance reaches billing handoff | attempt billing handoff with approved and unapproved rows mixed | readiness screenshot showing block + success after approval |
| Every critical state change is traceable | inspect audit history after state changes | audit timeline with actor, timestamp, before/after, reason |

## Reproducible Verification Pack

Run this pack on every workflow-critical branch before review:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
node scripts/validate-branch-name.mjs
node scripts/validate-pr-metadata.mjs "<pr-title>" "<pr-body>"
```

If a branch changes seeded data, mobile flows, or queue vocabulary, also attach:

- seed or fixture name used for the run
- viewport/device used for desktop and mobile captures
- exact operator role used for each screenshot or recording

## PR Evidence Requirements

### For [CMPAAAAAAAA-34](/CMPAAAAAAAA/issues/CMPAAAAAAAA-34)

- clean database or schema-init proof from a reproducible environment
- module boundary proof for `admin`, `api`, `domain`, `db`, and `jobs`
- at least one state-transition proof that exercises snapshot integrity
- audit and outbox contract proof, including idempotency expectation
- command output for `pnpm typecheck`, `pnpm test`, and `pnpm build`

### For [CMPAAAAAAAA-35](/CMPAAAAAAAA/issues/CMPAAAAAAAA-35)

- desktop captures for:
  - `Work Queue`
  - `Demand`
  - `Placement`
  - `Attendance`
  - `Billing`
- mobile capture for site-lead roster proving entry points for:
  - attendance
  - exception
  - evidence upload
- proof that status labels and primary actions match:
  - `docs/staffing-ops-user-flows.md`
  - `docs/staffing-ops-ux-direction.md`
  - `docs/cto-v1-delivery-plan.md`
- responsive verification for one desktop and one mobile viewport

## Role Boundary Verification

### Operations Coordinator

- can create and publish orders
- can place workers and resolve queue exceptions
- can correct attendance with reason codes
- cannot finalize billing export without finance-level permission

### Operations Manager

- can view all sites and high-risk queues
- can approve or review override-worthy operational decisions
- can inspect audit history and readiness blockers
- cannot submit site-lead attendance on behalf of mobile users without explicit acting flow

### Site Lead Mobile

- can view today roster
- can submit check-in/check-out
- can request replacement and upload evidence
- cannot edit rates, publish orders, alter billing state, or close invoice handoff

### Finance Admin

- can review invoice-readiness blockers and billing drafts
- can add manual billing adjustments with reasons
- can export or hand off invoices only when attendance is approved
- cannot edit historical attendance without a traceable correction flow

## Audit Trail Verification

Every audit record for the actions below must include `actor`, `timestamp`, `entity`, `action`, `before/after delta`, and `reason/notes` when applicable.

- order publish from draft
- placement confirmation
- blocked placement override
- no-show replacement
- attendance correction
- overtime approval
- retro attendance fix
- billing adjustment
- invoice handoff/export

Release is blocked if any of these actions mutate business state without a visible audit event.

## Mobile Resilience Verification

The mobile surface must demonstrate all of the following before pilot entry:

- retry after temporary network loss does not create duplicate attendance submissions
- photo upload failure can be retried without losing the selected record context
- pending submission state is visible to the site lead
- once connectivity resumes, roster state converges with desktop queue state

Recommended test conditions:

- toggle browser devtools to slow `3G` or offline during attendance submit
- interrupt an evidence upload mid-flight and confirm retry path
- reload after failure and confirm no silent data loss

## UAT Scenario Package

Each scenario must be run from queue entry to final record state. Capture start state, operator actions, end state, and linked audit proof.

### 1. Same-Day Urgent Order

**Goal**

- Verify fast-path intake can publish a staffing-ready urgent order without losing blockers or SLA visibility.

**Preconditions**

- client and site exist
- bill/overtime rules are present or intentionally missing for blocker verification

**Steps**

1. Create a same-day order from `Work Queue > Needs intake`.
2. Mark the order as urgent or fast-path.
3. Attempt publish with one required field missing and confirm the blocker state.
4. Complete the missing field and publish.
5. Confirm the order appears in `Needs staffing` with urgency signal.

**Pass / Fail**

- pass if the order cannot publish while incomplete, becomes traceable after publish, and urgency is visible in the queue
- fail if the operator can bypass missing critical data without blocker or if urgency is lost after publish

**Evidence**

- draft blocker screenshot
- published queue screenshot
- audit log for draft to publish transition

### 2. No-Show Replacement

**Goal**

- Verify a no-show can be converted into a replacement request without losing failed-assignment context.

**Preconditions**

- one confirmed assignment exists for today
- at least one alternate eligible worker exists

**Steps**

1. Mark the original assignee as no-show.
2. Open the replacement flow from the queue or assignment detail.
3. Review visible history for the failed assignment.
4. Confirm a replacement worker.
5. Verify the order or roster status updates immediately.

**Pass / Fail**

- pass if the original no-show remains visible in history, the replacement is traceable, and the queue status updates
- fail if replacement overwrites the original assignment or loses incident context

**Evidence**

- before/after placement board capture
- replacement history capture
- audit events for no-show and replacement confirm

### 3. Late Check-Out

**Goal**

- Verify late shift-close actuals are routed into attendance review instead of silently auto-approving.

**Preconditions**

- one active assignment exists with planned shift end

**Steps**

1. Submit an actual check-out later than planned.
2. Open the attendance queue.
3. Confirm the row is flagged as an exception.
4. Review planned versus actual values in the correction drawer.
5. Approve or adjust with a reason code.

**Pass / Fail**

- pass if the row is exception-flagged, original values remain visible, and approval requires explicit review
- fail if the row auto-approves without visibility into the mismatch

**Evidence**

- exception queue screenshot
- correction drawer screenshot
- audit log for the final approval decision

### 4. Overtime Correction

**Goal**

- Verify overtime changes preserve the original submission and force explicit bill/pay impact handling.

**Preconditions**

- one attendance row exists with overtime or premium condition

**Steps**

1. Open the exception row.
2. Adjust overtime values.
3. Select the applicable reason code.
4. Confirm the correction.
5. Verify the row becomes billing-ready only after approval.

**Pass / Fail**

- pass if original submitted values remain visible, the correction is traceable, and billing readiness changes only after approval
- fail if overtime edits destroy source values or bypass reason capture

**Evidence**

- before/after attendance row capture
- corrected-row audit capture
- billing-readiness state capture

### 5. Retro Attendance Fix

**Goal**

- Verify a historical correction can be applied without losing original source and approver history.

**Preconditions**

- one previously approved attendance row exists in a closed period candidate set

**Steps**

1. Find the historical attendance row.
2. Start retro correction flow.
3. Change the historical value and add a note or reason.
4. Confirm the system records the correction as a new decision.
5. Re-check billing readiness or exception state.

**Pass / Fail**

- pass if the system preserves original approval context and clearly records the retro correction
- fail if the fix silently mutates the original approved record

**Evidence**

- retro correction drawer capture
- audit timeline showing original approval and later correction
- billing impact or readiness screenshot

### 6. Billing Exception

**Goal**

- Verify billing handoff blocks unresolved attendance or manual adjustment ambiguity.

**Preconditions**

- a billing period exists with one clean row and one problematic row

**Steps**

1. Open the billing handoff workspace for the target period.
2. Inspect the blocked draft.
3. Drill into the blocking row.
4. Resolve the missing approval or add the required manual adjustment reason.
5. Re-run draft readiness and export or handoff.

**Pass / Fail**

- pass if the system blocks export until the exception is resolved and maintains traceability to source attendance and assignment snapshot
- fail if finance can export with unresolved blockers or undocumented adjustments

**Evidence**

- blocked draft screenshot
- drill-through to source row
- final ready/export state screenshot
- audit event for manual adjustment or export

## Exit Criteria

This QA gate is satisfied only when:

- the reproducible verification pack passes
- the acceptance checklist is fully evidenced
- all six UAT scenarios pass
- role boundary and audit checks pass
- mobile resilience checks pass
- residual risks are documented in the PR or release issue, with explicit owner and follow-up

If any single item above fails, the branch may still be reviewed, but it must not be tagged as release-ready or pilot-ready.

# Staffing Ops Correlated Pilot Evidence Archive

## Purpose

- Refresh the correlated pilot evidence archive under [CMPAAAAAAAA-52](/CMPAAAAAAAA/issues/CMPAAAAAAAA-52) with the now-completed outputs from [CMPAAAAAAAA-47](/CMPAAAAAAAA/issues/CMPAAAAAAAA-47) and [CMPAAAAAAAA-48](/CMPAAAAAAAA/issues/CMPAAAAAAAA-48).
- Record the current mixed-state billing proof in one QA-owned rerun pack instead of leaving the archive in a provisional pre-delivery state.
- Separate what is now proven at archive level from what still requires a real feature-branch rerun or additional risk-closure work before release approval.

## Source Of Truth For This Refresh

- Refresh issue: [CMPAAAAAAAA-52](/CMPAAAAAAAA/issues/CMPAAAAAAAA-52)
- Parent issue: [CMPAAAAAAAA-15](/CMPAAAAAAAA/issues/CMPAAAAAAAA-15)
- Prior QA packs:
  - `docs/staffing-ops-order-to-placement-verification-pack.md`
  - `docs/staffing-ops-attendance-to-billing-verification-pack.md`
  - `docs/staffing-ops-pilot-hardening-verification-pack.md`
  - `docs/staffing-ops-qa-release-gate.md`
- Upstream implementation deliveries:
  - [CMPAAAAAAAA-47](/CMPAAAAAAAA/issues/CMPAAAAAAAA-47)
    - delivery comment: [archive update](/CMPAAAAAAAA/issues/CMPAAAAAAAA-47#comment-e7f98e2a-ab1e-4327-9376-02d84d4f725f)
  - [CMPAAAAAAAA-48](/CMPAAAAAAAA/issues/CMPAAAAAAAA-48)
    - delivery comment: [archive update](/CMPAAAAAAAA/issues/CMPAAAAAAAA-48#comment-f432d4b6-c404-4706-ac42-f8968a78d62a)

## Dependency Status At Archive Time

Archive timestamp: `2026-04-07 20:51:18 KST`

- [CMPAAAAAAAA-47](/CMPAAAAAAAA/issues/CMPAAAAAAAA-47): `done`
- [CMPAAAAAAAA-48](/CMPAAAAAAAA/issues/CMPAAAAAAAA-48): `done`
- Both dependency issues now have published issue-comment summaries, so this archive no longer needs to treat their outputs as provisional.
- The remaining release caveat is no longer dependency completion. It is governance rerun evidence from an actual feature branch and actual PR metadata.

## 1. Run Envelope Metadata

| Field | Value |
| --- | --- |
| Git branch | `main` |
| Git commit | `1fe6d631c68877a6592dd9b0e4b34bfdd8d81289` |
| Paperclip run id | `8a67164f-362f-4ece-9c8b-df510ce67f6d` |
| Environment | local Paperclip execution workspace |
| Timezone | `Asia/Seoul` / `KST` |
| Node | `v22.16.0` |
| pnpm | `10.30.0` |
| QA role assumption | release-quality review and reproducible verification only |

## 2. Command Output Archive

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm check` | pass | `lint`, `typecheck`, `test`, and `build` all completed successfully in this workspace. |
| `pnpm validate:branch` | fail | Expected failure because the current branch is `main`, not `<ISSUE-ID>/<short-kebab-title>`. |
| `pnpm validate:pr` with incomplete synthetic metadata | fail | Confirms the PR gate is stricter than the previous archive captured. |
| `pnpm validate:pr` with compliant synthetic metadata | pass | Confirms the script contract when the required title and body sections are present. |

### Captured Output Summary

#### `pnpm check`

- `pnpm lint`: passed
- `pnpm typecheck`: passed
- `pnpm test:unit`: passed with `20` tests across `packages/db`, `packages/jobs`, and `packages/domain`
- `pnpm test:integration`: passed with `16` tests across `admin-shell`, `admin-flow`, `repo-contracts`, and `pilot-proof-fixture`
- `pnpm build`: passed

#### `pnpm validate:branch`

- Actual output:
  - `Invalid branch name "main". Expected "<ISSUE-ID>/<short-kebab-title>", for example "CMPAAAAAAAA-32/bootstrap-github-repo".`
- Release implication:
  - branch-governance proof is still unsatisfied from the shared QA workspace
  - rerun is still required from the real feature branch before merge or release approval

#### `pnpm validate:pr`

- Incomplete metadata failure proved these are mandatory:
  - title must start with `[ISSUE-ID] `
  - body must include `## Linked Paperclip Issue`
  - body must include `## Summary`
  - body must include `## Risk Notes`
  - body must include `## Verification Notes`
  - body must include a linked issue path such as `/CMPAAAAAAAA/issues/CMPAAAAAAAA-52`
- Compliant synthetic rerun passed with:
  - title: `[CMPAAAAAAAA-52] mixed-state billing rerun pack`
  - linked issue section present
  - risk notes present
  - verification notes present
- Release implication:
  - the older shorthand wording of `validate:pr "<title>" "<body>"` is no longer sufficient by itself
  - the release ticket must attach a rerun from the real PR title and real PR body

## 3. Current Fixture Description

The repository now has two complementary proof layers relevant to mixed-state billing:

| Proof layer | What it proves | Proof source |
| --- | --- | --- |
| One persisted batch-preparation fixture | approved rows export, blocked row exclusion, stable batch trace on one named dataset | `apps/api/src/pilot-proof.ts`, `tests/integration/pilot-proof-fixture.test.ts` |
| Review-surface mixed-state coexistence | `ready_for_handoff` and `approval_blocked` drafts coexist in the billing review surface and approval can clear a blocked draft | `packages/domain/src/operator-ui.ts`, `tests/integration/admin-flow.test.ts`, `tests/integration/admin-shell.test.ts` |

### Persisted one-fixture batch-preparation proof

- Fixture id: `design-partner-pilot-v1`
- Environment: `pilot-reviewable-proof`
- Operator roles archived in the proof bundle:
  - `operations_operator`
  - `operations_manager`
  - `finance_admin`
- Correlated trace:
  - `orderId`: `order-cold-chain-pilot-1`
  - `assignmentIds`:
    - `assignment-cold-chain-ready-1`
    - `assignment-cold-chain-override-1`
  - approved attendance ids:
    - `attendance-clean-approved-1`
    - `attendance-corrected-approved-1`
  - excluded attendance id:
    - `attendance-blocked-unapproved-1`
  - `exportBatchId`: `billing-handoff-batch-pilot-1`
  - `exportBatchKey`: `billing-handoff:billing-handoff-batch-pilot-1`
- Archive significance:
  - the one-fixture standard for batch-preparation proof is now satisfied at the backend proof-bundle layer
  - approved rows and blocked-row exclusion are correlated on one named dataset rather than split across unrelated fixtures

### Review-surface mixed-state coexistence proof

- The seeded operator billing surface exposes three simultaneous drafts:

| Billing draft | Status | Batch | Attendance source ids | Review meaning |
| --- | --- | --- | --- | --- |
| `bill-1` | `ready_for_handoff` | `batch-busan-week2` | `att-3`, `att-1` | approved/corrected rows are ready to send |
| `bill-2` | `approval_blocked` | `batch-suwon-week2` | `att-2` | overtime dispute still blocks handoff |
| `bill-3` | `approval_blocked` | `batch-suwon-cutoff-breach` | `att-4` | missing submission still blocks handoff |

- The same shell reports `Invoice blockers = 2`, which matches the two blocked drafts.
- `tests/integration/admin-flow.test.ts` proves `att-2` starts as the blocker for `bill-2`, then after approval:
  - `bill-2` moves from `approval_blocked` to `ready_for_handoff`
  - the linked review output shows `Assignment ID`, `Attendance ID`, and `Export batch ID`
- Archive significance:
  - mixed-state coexistence is now reviewable in the billing surface
  - the approval transition proof is no longer static-screen-only evidence

### Important nuance

- The persisted proof bundle and the operator review surface still use different identifier families.
- That means:
  - mixed-state billing is now archived as proven
  - full UI/runtime identifier unification is still not the thing this archive is claiming
- For this issue, the proof bar is satisfied because the one-fixture batch-preparation run exists and the review surface separately shows coexisting `ready_for_handoff` plus `approval_blocked` drafts.

## 4. End-To-End Happy-Path Proof

### What is proven now

- `tests/integration/pilot-proof-fixture.test.ts` proves one named fixture can carry:
  - order publish
  - standard placement
  - override-backed placement
  - clean approved attendance
  - corrected plus re-approved attendance
  - approved-only finance handoff export
  - blocked attendance exclusion from the export artifact
- `tests/integration/repo-contracts.test.ts` still proves cross-package envelope continuity for finance handoff payload construction.
- `tests/integration/admin-flow.test.ts` proves the UI review flow can move `bill-2` from blocked to handoff-ready after the linked attendance approval is resolved.

### What is no longer a blocker for this archive

- The repository is no longer limited to unrelated proof fragments for billing export.
- The mixed-state billing gap called out in the previous archive is now closed at archive level.

## 5. Blocker And Override Proof

### Strong current evidence

- `packages/domain/test/index.test.ts` proves assignment commit still blocks until an override reason exists.
- `tests/integration/admin-flow.test.ts` proves:
  - blocked candidate selection is visible before commit
  - commit fails without override
  - override reason is persisted into the review surface
  - resulting assignment proof shows assignment id and override reason
- `tests/integration/pilot-proof-fixture.test.ts` proves the persisted proof bundle keeps:
  - a standard placement path
  - an override-backed placement path
  - both assignment ids in the same archived trace

### Remaining gap

- Role-boundary enforcement is still separate work.
- The archive can prove override existence and traceability, but not yet the final permission-boundary matrix for who may perform each action.

## 6. Correction And Re-Approval Proof

### Strong current evidence

- `packages/domain/test/index.test.ts` explicitly proves correction plus re-approval before finance handoff is triggered again.
- `tests/integration/pilot-proof-fixture.test.ts` proves the persisted fixture keeps:
  - correction audit proof
  - re-approval proof
  - reapproval-triggered finance handoff proof
- `packages/domain/src/operator-ui.ts` and `tests/integration/admin-shell.test.ts` keep the review surface visible for corrected attendance context.

### Remaining gap

- The remaining QA question here is no longer whether correction and re-approval exist.
- The remaining open work is role-boundary enforcement and mobile recovery, not the correction flow itself.

## 7. Export Artifact Proof

### Strong current evidence

- `tests/integration/pilot-proof-fixture.test.ts` proves the persisted export artifact carries:
  - stable `exportBatchId`
  - stable `batchKey`
  - approved `sourceAttendanceIds`
  - excluded blocked attendance id in the archive trace
- `tests/integration/repo-contracts.test.ts` still proves envelope shape continuity and stable source trace fields.
- The proof bundle now archives export rows for:
  - `assignment-cold-chain-ready-1`
  - `assignment-cold-chain-override-1`

### Archive decision

- The export artifact gap that previously depended on [CMPAAAAAAAA-47](/CMPAAAAAAAA/issues/CMPAAAAAAAA-47) is now closed at archive level.

## 8. Persisted Audit And Review-Surface Proof

### What is available now

- [CMPAAAAAAAA-48](/CMPAAAAAAAA/issues/CMPAAAAAAAA-48) added billing and attendance identifier panels to the operator review surfaces.
- `tests/integration/admin-flow.test.ts` now asserts review output contains:
  - `Assignment ID`
  - `Attendance ID`
  - `Export batch ID`
- `packages/domain/src/operator-ui.ts` keeps audit trails for:
  - override review
  - attendance correction and re-approval
  - billing blocked vs ready states

### Remaining caveat

- The review surface is still seeded shell evidence rather than a true persisted runtime playback of the backend proof fixture.
- That caveat no longer blocks this mixed-state billing archive refresh, but it should stay visible in release discussion.

## 9. Residual Risk Notes

## Pilot entry decision

- Merge-readiness baseline: `yes`
- Mixed-state billing archive proof: `yes`
- Pilot entry readiness: `not yet approved`

### P1 risk separation after this refresh

#### Mixed-state billing

- Status: `archived / no longer open as a standalone proof gap`
- Why:
  - one named persisted fixture now proves approved export rows and blocked-row exclusion
  - the billing review surface now shows simultaneous `ready_for_handoff` and `approval_blocked` drafts
  - approval transition proof now exists for the previously blocked `bill-2` path
- Remaining release caveat:
  - feature-branch and real-PR reruns still need to be attached for final approval

#### Role-boundary proof

- Status: `open`
- Current evidence:
  - action traceability exists for override, correction, approval, and billing handoff
- Remaining gap:
  - no archived permission-enforcement proof yet shows exactly which role may override placement, correct attendance, or export billing artifacts
- Related issue:
  - [CMPAAAAAAAA-50](/CMPAAAAAAAA/issues/CMPAAAAAAAA-50)

#### Mobile retry and evidence-upload recovery

- Status: `open`
- Current evidence:
  - mobile entry points exist in the seeded shell
- Remaining gap:
  - no unstable-network retry proof
  - no evidence-upload recovery archive
  - no duplicate-submission protection proof captured in a release artifact
- Related issue:
  - [CMPAAAAAAAA-51](/CMPAAAAAAAA/issues/CMPAAAAAAAA-51)

## Required Rerun Before Release Approval

Run the following from the real feature branch and the real PR context before final release approval:

1. `pnpm check`
2. `pnpm validate:branch`
3. `pnpm validate:pr "[ISSUE-ID] summary" "<real-pr-body>"`
4. attach the real PR body sections:
   - `## Linked Paperclip Issue`
   - `## Summary`
   - `## Risk Notes`
   - `## Verification Notes`
5. re-archive one release-ticket proof set that includes:
   - one persisted fixture export proof
   - one review-surface mixed-state billing proof
   - final status notes for open P1 items or their waivers

## Release Quality Conclusion

- The repository now clears the mixed-state billing archive gap that was open in the previous QA document.
- The current workspace also proves the stronger PR metadata contract that future release tickets must satisfy.
- Release approval should still wait for:
  - feature-branch rerun output
  - real PR metadata rerun output
  - closure or explicit waiver of the remaining open P1 risks

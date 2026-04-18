# Demo Bundle

Generated with `pnpm demo:bundle` after a full TypeScript build.

## Admin HTML snapshots

- [Work queue baseline (desktop)](./admin/01-work-queue-desktop.html): Baseline desktop queue for operator triage.
- [Work queue baseline (mobile)](./admin/02-work-queue-mobile.html): Mobile variant for site or manager review.
- [Demand draft with commercial blockers](./admin/03-demand-draft.html): Incheon order before commercial fields are fully resolved.
- [Demand draft after commercial unblock](./admin/04-demand-publish-ready.html): Same order after bill rate and overtime policy are completed.
- [Published demand order](./admin/05-demand-published.html): Order moved from blocked draft into staffing-ready state.
- [Placement candidate selected](./admin/06-placement-selected.html): Override-required candidate selected for Seoul East Mall.
- [Placement override armed](./admin/07-placement-override-armed.html): Manager rationale attached so the commit can proceed.
- [Placement committed](./admin/08-placement-committed.html): Override commit captured and order headcount advanced.
- [Attendance under exception review](./admin/09-attendance-review.html): Finance-impacting overtime row still waiting on operator approval.
- [Attendance approved](./admin/10-attendance-approved.html): Attendance row approved and billing draft unblocked.
- [Billing handoff ready](./admin/11-billing-ready.html): Billing draft opened after approval released the export gate.

## Pilot proof JSON

- [Design partner pilot proof bundle](./proof/design-partner-pilot.bundle.json): Full pilot-reviewable proof payload with audit trails and export artifact.
- [Design partner pilot proof summary](./proof/design-partner-pilot.summary.json): Compact summary of the pilot trace, export batch, and denied role-boundary proofs.

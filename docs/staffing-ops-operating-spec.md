# Staffing Operations Operating Spec

## Purpose
- Turn the base workflow map into an operator-ready spec for Korean staffing, dispatch, and outsourcing teams.
- Make ownership, decision gates, exception routing, and field-process requirements explicit enough for product scoping.
- Give Product and CTO a repeatable requirement format so workflow ambiguity does not reappear during implementation.

## Decision Summary
- Primary v1 operating persona: `Operations Coordinator`.
- First wedge remains the internal operations loop:
  - order intake
  - worker matching and placement
  - pre-shift readiness
  - attendance approval
  - payroll and billing handoff
- v1 should optimize for human-in-the-loop control, exception visibility, and auditability rather than automation depth.

## Service-Type Branching

| Service type | Operating difference | What the system must vary |
| --- | --- | --- |
| `파견` / dispatch | Worker-to-client-site linkage is explicit and worker readiness must be validated before start. Client-facing restrictions and consent artifacts matter more. | Site restrictions, worker consent or dispatch-readiness artifacts, client-side approval gates, assignment-level legal/compliance blockers. |
| `도급` / subcontracted on-site labor | Internal field lead or site leader often controls attendance approval and replacement decisions. Team-level continuity matters more than one-off placement. | Site leader approval routes, team roster view, internal field-lead ownership, same-site replacement queue, output or scope notes per site. |
| `아웃소싱` / recurring outsourcing operations | Repeated schedules, recurring headcount patterns, and stable site rosters dominate. Continuity and recurring issue tracking matter more than single orders. | Recurring order templates, repeat roster cloning, long-running site calendars, recurring exception trends, site-level staffing coverage metrics. |

## Canonical Operating Lanes
- `Account Manager`
  - Owns commercial confirmation, client relationship, and incomplete demand follow-up.
- `Operations Coordinator`
  - Owns the control tower from intake release to attendance closure.
- `Site Leader / Field Manager`
  - Owns arrival confirmation, actuals submission, site-side dispute input, and urgent field escalation.
- `Compliance / HR Admin`
  - Owns document validity, training completion, contract readiness, and deployability gates.
- `Payroll Admin`
  - Owns payable handoff review and post-payroll adjustments.
- `Billing / Finance Admin`
  - Owns invoice-quality gate, client-format handoff, and dispute closure.

## Operational Workflow

### 1. Demand Intake And Qualification

**Owner**
- Primary: `Account Manager`
- Supporting: `Operations Coordinator`

**Entry criteria**
- Client request arrives by phone, KakaoTalk, email, spreadsheet, or recurring standing order.

**Required operator actions**
1. Create or update the `Order` on the same day.
2. Confirm client, site, service type, role, headcount, schedule, rate rule, and attendance approval route.
3. Tag urgency:
   - `same_day`
   - `next_day`
   - `planned`
4. Capture source evidence:
   - call note
   - KakaoTalk summary
   - attached sheet
   - email reference

**Exit criteria**
- Order reaches `ready_for_staffing`.

**Hard stop conditions**
- Commercial terms missing.
- Site not configured.
- Required qualifications undefined.
- Attendance approval route undefined.

**System requirements**
- Mandatory-field gating before staffing release.
- Save-incomplete mode with visible blocker checklist.
- Order-source evidence link on every order.
- Recurring order template support for repeat demand.
- SLA timer that starts at first intake and changes color by urgency.

### 2. Staffing Release And Candidate Matching

**Owner**
- Primary: `Operations Coordinator`
- Supporting: `Compliance / HR Admin`

**Entry criteria**
- Order is `ready_for_staffing`.

**Required operator actions**
1. Open the matching board from the order.
2. Filter worker pool by role, region, availability, site restriction, service-type eligibility, and compliance readiness.
3. Record outreach attempts and worker responses.
4. Resolve missing documents or disqualify the worker with a structured reason.
5. Move the order to:
   - `staffing_in_progress`
   - `partially_filled`
   - `fully_filled`

**Exit criteria**
- Confirmed worker count matches order demand or the order is intentionally left partially filled with open headcount.

**Hard stop conditions**
- No eligible worker available.
- Site-specific restriction unresolved.
- Compliance artifact expired or missing.

**System requirements**
- One-screen eligibility view with explicit blocker reasons.
- Partial-fill support without duplicating the order.
- Worker outreach status tracking:
  - not contacted
  - contacted
  - interested
  - declined
  - unreachable
- Replacement standby pool on the same order.

### 3. Assignment Creation And Pre-Start Readiness

**Owner**
- Primary: `Operations Coordinator`
- Supporting: `Compliance / HR Admin`, `Site Leader`

**Entry criteria**
- Worker accepts and any client/site approval is complete.

**Required operator actions**
1. Create the `Assignment`.
2. Snapshot:
   - work dates
   - schedule pattern
   - pay rule
   - bill rule
   - site instructions
3. Verify contract and deployability artifacts.
4. Send pre-start briefing and record acknowledgment status.
5. Push the worker onto the day-of roster.

**Exit criteria**
- Assignment status reaches `assigned` and then `start_ready`.

**Hard stop conditions**
- Contract not ready.
- Required training incomplete.
- Worker unreachable before start.
- Site contact not confirmed for first shift.

**System requirements**
- Assignment snapshot fields must not drift with later order edits.
- Pre-start checklist must block start readiness until all critical items are complete.
- Reminder tasks for missing items within lead windows such as D-1 and D-0.
- Site roster export or shareable view for field leads.

### 4. Day-Of Dispatch And Arrival Control

**Owner**
- Primary: `Operations Coordinator`
- Supporting: `Site Leader`

**Entry criteria**
- Shift date has arrived.

**Required operator actions**
1. Review site-by-site dispatch board.
2. Confirm first-shift arrivals and same-day attendance risk.
3. Trigger replacement if:
   - no-show
   - last-minute cancellation
   - site rejection on arrival
4. Record phone or chat evidence for same-day deviations.

**Exit criteria**
- All shift starts are confirmed, replaced, or explicitly escalated.

**Hard stop conditions**
- No-show without replacement candidate.
- Site contact unreachable.
- Unapproved worker attempts to work.

**System requirements**
- Site and shift dispatch board grouped by date and location.
- Arrival confirmation status:
  - not confirmed
  - confirmed
  - late
  - no-show
  - replaced
- Emergency escalation contact chain per site.
- Same-day exception queue separated from normal backlog.

### 5. Attendance Capture And Correction

**Owner**
- Primary: `Site Leader` for submission
- Primary: `Operations Coordinator` for review and correction

**Entry criteria**
- Shift is underway or completed.

**Required operator actions**
1. Generate planned attendance rows from assignments.
2. Capture actuals from one approved source.
3. Compare planned vs actual values.
4. Route mismatches into the exception queue.
5. Apply corrections with typed reasons and evidence.
6. Move clean rows to approval.

**Exit criteria**
- Attendance status reaches `approved` or a controlled exception state before cutoff.

**Hard stop conditions**
- Site submission missing at cutoff.
- Duplicate rows exist.
- Worker worked without assignment.
- Payable and billable treatment differ without reason code.

**System requirements**
- Planned-vs-actual view side by side.
- Immutable original submitted values.
- Typed correction reasons and evidence links.
- Separate payable and billable adjustment handling.
- Configurable cutoff rules by client or site.

### 6. Payroll Handoff

**Owner**
- Primary: `Payroll Admin`
- Supporting: `Operations Coordinator`

**Entry criteria**
- Payable attendance is approved for the payroll period.

**Required operator actions**
1. Group approved payable rows into a payroll batch.
2. Resolve or explicitly classify open pay exceptions.
3. Review worker-level totals and allowances.
4. Freeze the payable snapshot.
5. Export or hand off the batch.

**Exit criteria**
- Payroll batch reaches `sent_to_payroll` or `closed`.

**Hard stop conditions**
- Pay-impacting exception unresolved.
- Worker identity or bank reference missing.
- Post-cutoff correction not classified as delta adjustment.

**System requirements**
- Payroll cutoff calendar independent from billing cutoff.
- Frozen payable snapshot.
- Post-handoff delta adjustment records instead of silent edits.
- Batch-level statuses and acceptance tracking.

### 7. Billing Handoff

**Owner**
- Primary: `Billing / Finance Admin`
- Supporting: `Operations Coordinator`, `Account Manager`

**Entry criteria**
- Billable attendance is approved for the billing period.

**Required operator actions**
1. Group approved billable rows into a billing batch or draft invoice.
2. Review site-specific rate application and manual adjustments.
3. Apply typed reason codes to any commercial adjustment.
4. Export in the required client format.
5. Log invoice send state and any disputes.

**Exit criteria**
- Billing batch reaches `invoice_sent` or `closed`.

**Hard stop conditions**
- Rate snapshot mismatch.
- Client-specific invoice format missing.
- Attendance dispute unresolved on material lines.

**System requirements**
- Invoice-line drill-down to assignment and attendance source.
- Client-specific billing template support.
- Manual adjustments visible as separate lines.
- Dispute case creation directly from invoice or billing rows.

### 8. Post-Handoff Adjustment And Closure

**Owner**
- Primary depends on impact:
  - `Payroll Admin` for pay corrections
  - `Billing / Finance Admin` for invoice disputes
  - `Operations Coordinator` for source-record correction

**Entry criteria**
- A correction arrives after payroll handoff or invoice send.

**Required operator actions**
1. Open an `ExceptionCase`.
2. Identify whether the correction changes:
   - source attendance
   - payable amount
   - billable amount
   - both
3. Preserve the original locked record.
4. Create adjustment deltas and approval trail.
5. Close the case only when downstream records are updated too.

**Exit criteria**
- Operational and financial impacts are both resolved.

**System requirements**
- Reopen controls with restricted permissions.
- Delta adjustment model.
- Downstream-impact flags on every late correction.
- Root-cause tagging for later reporting.

## Exception Response Matrix

| Exception | Detect point | First owner | Immediate SLA | Downstream hold | Required system behavior |
| --- | --- | --- | --- | --- | --- |
| Same-day urgent order with no ready worker pool | Intake or dispatch board | Operations Coordinator | within 15 minutes | No payroll or billing yet, but staffing risk is immediate | Fast-path order flag, visible SLA breach timer, standby candidate list, escalation to AM and site contact |
| Worker cancels after confirmation | Pre-start or day-of | Operations Coordinator | within 10 minutes | Assignment replacement risk | Linked replacement flow, preserve cancelled assignment history, notify site roster owner |
| First-day no-show | Day-of dispatch | Operations Coordinator | immediate | Attendance and service continuity at risk | Arrival status alert, replacement shortcut, evidence log, site escalation path |
| Site rejects worker on arrival | Day-of dispatch | Operations Coordinator + Account Manager | within 30 minutes | Attendance blocked and client risk elevated | Structured rejection reason, replacement or pullback decision, client escalation log |
| Worker worked without formal assignment | Attendance capture | Operations Coordinator | same day | Payroll and billing must pause | Forced provisional assignment flow, manager approval, audit flag |
| Attendance missing at cutoff | Attendance queue | Site Leader then Operations Coordinator | before cutoff or within 2 hours after breach | Payroll and billing batch blocked | Cutoff alerts, overdue queue, escalation chain, forced placeholder state |
| Overtime or premium dispute | Attendance correction | Operations Coordinator + Site Leader | within 1 business day | Payable and billable totals may diverge | Separate payable and billable decision fields, reason code, evidence attachment |
| Client reduces headcount after workers committed | Pre-start or live ops | Account Manager + Operations Coordinator | same day | Potential cancellation cost and reassignment need | Partial cancellation flow, worker redeployment queue, commercial note capture |
| Retroactive rate change request | Billing review or dispute | Account Manager + Billing Admin | within 1 business day | Billing batch hold | Rate-change approval record, effective-date logic, snapshot override audit |
| Payroll processed before correction arrives | Post-handoff | Payroll Admin | within 1 business day | Payroll delta required | Delta adjustment case, payroll-period linkage, lock original batch |
| Invoice already sent and client disputes lines | Post-handoff | Billing Admin + Account Manager | within 1 business day | Billing close blocked | Dispute case from invoice line, source-row drill-down, credit or rebill path |

## Approval And Lock Rules
- The following transitions must require explicit approval:
  - `ready_for_staffing`
  - `assigned`
  - `approved` attendance
  - `sent_to_payroll`
  - `invoice_sent`
- The following edits must create a new audit event and not overwrite prior state silently:
  - rate changes after assignment
  - schedule changes after attendance exists
  - attendance corrections after approval
  - adjustments after payroll or billing handoff
- Any post-handoff correction must produce:
  - source record reference
  - delta amount or delta hours
  - approver
  - downstream action owner

## Field-Process Requirements
- Operators must be able to log evidence from phone, KakaoTalk, and spreadsheet sources without losing provenance.
- Site leaders need a simple roster confirmation workflow even if v1 does not expose a full external portal.
- Multi-site coordinators need one calendarized day-of view, not separate site screens only.
- The system must handle recurring rosters and repeat demand without full order re-entry.
- Attendance and dispatch rules must assume `Asia/Seoul`, shift-based dates, and holiday or night premium treatment.
- Cutoff handling must support different calendars for:
  - payroll
  - billing
  - site attendance submission
- Operators need explicit queue ownership:
  - who owns the exception now
  - when it must be resolved
  - what downstream step is blocked

## Product Handoff Template

For each workflow feature, Product and CTO should capture requirements in the format below.

### 1. Business intent
- What operational outcome changes.
- Which internal persona owns the step.
- What SLA or business metric improves.

### 2. Entry and exit states
- Trigger event.
- Allowed starting statuses.
- Required completion status.
- Explicit lock or approval point.

### 3. Data and snapshots
- Core entities touched.
- Which values are live references.
- Which values must be snapshotted.
- Which files or evidence links are mandatory.

### 4. Decision rules
- Mandatory validations.
- Auto-routing logic.
- Manual approval rules.
- Service-type-specific branches for `파견`, `도급`, and `아웃소싱`.

### 5. Exception handling
- Detectable exception types.
- First owner and escalation owner.
- Required response SLA.
- Whether payroll or billing must pause.

### 6. UI shape
- Queue, table, board, or form.
- Required filters and status chips.
- Bulk actions allowed.
- Inline edit vs side-drawer vs dedicated detail screen.

### 7. Audit and reporting
- Required audit events.
- Metrics to instrument.
- Reports or dashboards needed.

### 8. Non-goals
- What the feature must not attempt in v1.

## MVP Scope Guardrails
- Do not build worker self-service in v1.
- Do not build a payroll calculation engine in v1.
- Do not hide exceptions inside notes or chat exports.
- Do not allow finance-facing quantities to change without traceable deltas.
- Do not model service-type differences as free text only; use structured flags and rules.

## Recommended Immediate Build Sequence
1. Order intake with gating and recurring templates.
2. Matching board with eligibility blockers and assignment snapshots.
3. Day-of dispatch board and arrival control.
4. Attendance comparison, correction, and approval queue.
5. Payroll and billing handoff batches with lock and delta adjustment logic.
6. ExceptionCase workflow with owner, SLA, and downstream-impact flags.

# Staffing Operations User Flows

## Purpose
- Separate operator task flow design from screen-level layout decisions.
- Give Product Manager and engineering a workflow contract they can turn into scope, acceptance criteria, and state transitions.
- Make exception handling explicit so v1 does not only describe happy paths.

## Primary Users
- `Operations Coordinator`: owns order activation, staffing, placement, attendance exception handling, and same-day issue resolution.
- `Account Manager`: maintains client and site context, monitors fill risk, and intervenes when client-side decisions block fulfillment.
- `Finance Admin`: validates invoice readiness after attendance closure and manages manual billing adjustments.

## Flow Design Rules
- Every flow starts from a queue, not from a blank record browser.
- Every critical step must answer three questions before commit:
  - what is the operator deciding now
  - what blocks this decision
  - what downstream state changes after confirmation
- Exception work must branch from the same operating flow instead of sending users into a separate tool.
- Any branch that changes pay, bill rate, attendance, or invoicing must preserve original values and reason codes.

## Flow 1. Client Order Intake

### Goal
- Convert incoming demand into a staffing-ready order without losing commercial or site-specific context.

### Trigger
- Incoming request via phone, KakaoTalk, email, spreadsheet, or recurring weekly order pattern.

### Primary Actor
- `Operations Coordinator` or `Account Manager`

### Entry Points
- `Work Queue > Needs intake`
- `Demand > Client/Site context > Create order`
- `Recurring order template > Generate new order`

### Main Path
1. Operator selects client and site or creates missing site context inline.
2. Operator fills role, headcount, schedule, rate rules, and required qualifications.
3. System validates missing commercial fields, site setup gaps, and contradictory schedule rules in real time.
4. Operator saves as draft or publishes to staffing.
5. Published order enters `Needs staffing` with a visible fill target and urgency signal.

### Key Decisions
- Is the order complete enough to release to staffing?
- Are site defaults safe to inherit or does this request require overrides?
- Should the order remain draft because of commercial uncertainty?

### Exception Paths
- Missing bill rate or overtime rule:
  - order remains in `pending_commercial`
  - owner and missing fields are surfaced in queue
- Missing site operating data:
  - order remains in `pending_site_setup`
  - operator can assign site setup follow-up without losing drafted order data
- Urgent same-day order:
  - operator marks fast-path
  - system raises SLA indicator and pins the order in the queue

### UX Implications
- The form must use section-based progression with a sticky readiness summary.
- Incomplete orders need a recoverable draft state with explicit blockers, not a generic validation error wall.
- Repeated site defaults should be prefilled but always visibly marked as inherited values.

## Flow 2. Worker Qualification And Matching

### Goal
- Move an open order to a confirmed assignment using the fewest possible comparison steps.

### Trigger
- Order enters `Needs staffing` or `Partially filled`.

### Primary Actor
- `Operations Coordinator`

### Entry Points
- `Work Queue > Needs staffing`
- `Demand > Order detail > Match workers`
- `Placement > Open demand board`

### Main Path
1. Operator opens one order and sees requirement summary plus current fill gap.
2. System presents ranked candidate rows combining qualification fit, compliance status, availability, and recent assignment context.
3. Operator filters or compares candidates without leaving the board.
4. Operator reviews the selected worker detail panel and confirms assignment terms.
5. System creates the assignment with snapshotted schedule and rate data.
6. Order fill status updates immediately and next required action becomes visible.

### Key Decisions
- Is a candidate truly placeable now, not just theoretically eligible?
- Does the operator resolve a blocker or move to the next viable worker?
- Is client-side approval required before assignment confirmation?

### Exception Paths
- Worker blocked by missing compliance:
  - blocker reason appears inline in the candidate row
  - operator can create a remediation task or switch candidates without losing context
- Partial fill:
  - one assignment is confirmed
  - order remains open with updated remaining headcount
- No-show or replacement needed:
  - same board reopens with previous assignment history visible
  - replacement flow preserves failed assignment context and incident notes

### UX Implications
- Candidate evaluation must stay in one compare-and-decide workspace.
- Ranked recommendations are useful only if the blocking reasons are legible and actionable.
- The board must show why a worker is disqualified before the operator clicks deeper.

## Flow 3. Pre-Shift Readiness And Day-Of-Ops Control

### Goal
- Reduce first-shift failure and same-day operational surprises.

### Trigger
- Assignment start falls within the configured lead window.

### Primary Actor
- `Operations Coordinator`

### Entry Points
- `Work Queue > Starting soon`
- `Placement > Assignment detail`
- `Operations Home > Alerts rail`

### Main Path
1. System groups upcoming starts by day, site, and risk level.
2. Operator reviews readiness checklist for contactability, documents, contracts, and site confirmation.
3. Operator resolves any missing items or escalates to the correct owner.
4. First-shift arrival is confirmed and the assignment moves into active service.

### Exception Paths
- Expired compliance artifact detected before start.
- Site contact not confirmed.
- Worker unreachable or unconfirmed.
- Same-day replacement standby required.

### UX Implications
- This workspace should feel like a control tower, not a buried tab inside assignment detail.
- Risk ordering matters more than chronological ordering.
- Alert fatigue must be controlled by grouping issues into actionable buckets.

## Flow 4. Attendance Approval And Correction

### Goal
- Approve clean shifts quickly while forcing explicit review on anything that affects payable or billable time.

### Trigger
- Shift actuals arrive from site entry, operator entry, upload, or external import.

### Primary Actor
- `Operations Coordinator`

### Entry Points
- `Work Queue > Attendance exceptions`
- `Attendance > Daily approval queue`
- `Assignment detail > Attendance tab`

### Main Path
1. System generates planned shift rows from assignments and overlays incoming actuals.
2. Clean rows with no mismatch are bulk-approved.
3. Exception rows open in a correction drawer with original vs edited values side by side.
4. Operator applies correction, reason code, and note.
5. Approved rows move to billing readiness.

### Key Decisions
- Is the mismatch operationally acceptable or does it need correction?
- Does the correction affect payroll only, billing only, or both?
- Is supporting evidence required before approval?

### Exception Paths
- No-show
- Late arrival or early leave
- Overtime or premium pay condition
- Duplicate attendance row
- Shift worked without pre-created assignment
- Site failed to submit by cutoff

### UX Implications
- Table density is critical because this is a volume workflow.
- Bulk actions must exclude rows with unresolved exceptions automatically.
- Corrected rows must always preserve submitted source values and the operator who changed them.

## Flow 5. Billing Handoff

### Goal
- Convert approved attendance into invoice-ready drafts with traceability.

### Trigger
- Billing period closes or operator opens billing preparation for a client.

### Primary Actor
- `Finance Admin`

### Entry Points
- `Work Queue > Ready for invoice handoff`
- `Billing > Draft invoices`
- `Client account > Billing tab`

### Main Path
1. Finance opens the target billing period and reviews draft readiness.
2. System flags any missing approvals, rate snapshot issues, or manual adjustments still lacking reasons.
3. Finance inspects line items with drill-through to attendance and assignment source.
4. Finance adds explicit adjustments if needed.
5. Draft is exported or handed off and becomes immutable.

### Exception Paths
- Missing attendance approval blocks invoice export.
- Assignment snapshot mismatch detected.
- Manual credit or surcharge needed with documented reason.
- Client dispute requires trace-back to source shifts.

### UX Implications
- Billing is a traceability workflow, not a freeform spreadsheet.
- Readiness blockers must appear before line-item inspection.
- Export state should lock the draft clearly to prevent accidental post-hoc edits.

## Cross-Flow Service Patterns

### Queue Pattern
- Each workflow should expose one default queue with saved filters, urgency sorting, and visible blockers.

### Review Pattern
- Reviews happen in tables with side drawers or split panes, not in page-to-page navigation.

### Audit Pattern
- Every critical detail view must show recent changes, current owner, and last decision point.

### Escalation Pattern
- If a task cannot continue because another role owns the decision, the UI should offer a handoff action with preserved context instead of forcing operators to leave the system.

## Product Manager Handoff Notes
- Convert each flow trigger and exception path into backlog slices and state-transition rules.
- Treat queue entry criteria as product requirements, not implementation details.
- Preserve the distinction between workflow contract in this document and screen/layout definition in `docs/staffing-ops-screen-blueprint.md`.
- Attach explicit acceptance criteria to the highest-risk flows first:
  - order publish readiness
  - match-and-place decision support
  - attendance correction traceability
  - billing draft readiness gating

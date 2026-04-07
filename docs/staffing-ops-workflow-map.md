# Staffing Operations Workflow Map

## Purpose
- Translate Korean dispatch, staffing, and outsourcing field operations into one concrete internal workflow map.
- Define the actual handoff chain from demand intake to placement, attendance closure, payroll handoff, and billing handoff.
- Surface exception paths, bottlenecks, SOP checkpoints, and system requirements for the first product wedge.

## v1 Operating Assumptions
- Country: South Korea only.
- Operator model: internal back-office users only in v1.
- Service types in scope:
  - dispatch (`파견`)
  - subcontracted on-site labor or managed service (`도급`)
  - outsourcing operations with recurring worker deployment (`아웃소싱`)
- Time granularity: daily and shift-based operations, not monthly planning only.
- First product goal: reduce spreadsheet, KakaoTalk, phone-call, and paper handoff between operations and finance.

## Primary Internal Roles

### Sales / Account Manager
- Owns client relationship, commercial terms, and initial demand capture.
- Confirms rate card, order scope, service type, and escalation contact.

### Operations Coordinator
- Owns day-to-day order activation, worker matching, placement status, replacement actions, and issue resolution.
- Is the main control tower for same-day changes and attendance anomalies.

### Site Leader / Field Manager
- Confirms worker arrival, actual attendance, break time, overtime, and site incidents.
- Approves or disputes shift records before finance handoff.

### Compliance / HR Admin
- Verifies worker documents, eligibility, mandatory training, and contract readiness.
- Blocks deployment when legal or client-required documents are missing or expired.

### Payroll Admin
- Receives approved payable attendance data and exception-adjusted pay inputs.
- Needs a closed handoff package, not raw operational chatter.

### Billing / Finance Admin
- Receives approved billable attendance data, rate snapshots, manual adjustments, and supporting evidence.
- Needs invoice-ready output with dispute traceability back to the shift or assignment.

## Core Operational Control Objects
- `ClientAccount`: bill-to customer and commercial owner.
- `Site`: physical work location and on-site contact.
- `Order`: staffing demand request with dates, role, headcount, rates, and shift rules.
- `Worker`: deployable person with documents, availability, and qualification flags.
- `Assignment`: worker-to-order placement record with fixed rate and schedule snapshots.
- `Attendance`: daily or shift-level actuals plus approval and exception state.
- `PayrollHandoffBatch`: payable attendance package sent to payroll.
- `BillingHandoffBatch`: billable attendance package sent to finance.
- `ExceptionCase`: tracked operational problem tied to order, assignment, attendance, or handoff.

## End-to-End Workflow

### 1. Client Order Intake

#### Trigger
- Client sends a request by phone, KakaoTalk, email, spreadsheet, or recurring weekly pattern.

#### Required capture
- client and site
- service type: dispatch, subcontract, or outsourcing
- role or job type
- headcount
- work period and shift pattern
- required qualifications or client restrictions
- bill rate or pricing rule
- overtime, night, holiday, meal, and transport rules
- reporting line on site
- attendance approval method
- billing cycle and invoice requirements

#### Intake SOP
1. Account manager or operations coordinator creates the order on the same day it is received.
2. System validates mandatory fields before the order can move to `ready_for_staffing`.
3. If commercial terms are missing, the order stays in `pending_commercial`.
4. If site-level operating data is missing, the order stays in `pending_site_setup`.
5. Once minimum data is complete, the order is released to staffing and placement.

#### Intake state model
- `draft`
- `pending_commercial`
- `pending_site_setup`
- `ready_for_staffing`
- `staffing_in_progress`
- `partially_filled`
- `fully_filled`
- `in_service`
- `closed`
- `cancelled`

#### Main bottlenecks
- Client sends incomplete order specs.
- Rates are agreed verbally but not recorded.
- Shift rules differ by site and are stored only in chat.
- Recurring orders are re-entered manually each week.

#### System requirements
- One intake form must support both one-off and recurring orders.
- Operator must be able to save incomplete demand and clearly see missing mandatory items.
- Every order needs a source channel and source evidence reference.
- Rate rules must be versioned and snapshotted before assignment.
- Same-day urgent orders need a fast-path flag and SLA timer.

### 2. Worker Qualification and Placement

#### Trigger
- Order reaches `ready_for_staffing`.

#### Placement SOP
1. Coordinator filters eligible workers by role, geography, availability, qualification, and client restrictions.
2. Compliance check confirms legal and client-mandatory documents are valid for the work period.
3. Coordinator proposes candidate workers and records outreach status.
4. Worker confirms acceptance.
5. Site or client confirms final placement if required.
6. Assignment is created with copied order terms, pay terms, and planned schedule.
7. Pre-start briefing and arrival instructions are sent.

#### Placement state model
- `candidate_pool`
- `contacting`
- `worker_confirmed`
- `client_pending`
- `assigned`
- `arrived_first_shift`
- `active`
- `replacement_requested`
- `ended`
- `cancelled_before_start`

#### Field realities to treat as first-class
- One worker may hold overlapping offers but only one confirmed assignment.
- One order may be partially filled and stay open for more headcount.
- Some sites require client-side approval before final assignment.
- Some workers are only valid for certain service types, shifts, or regions.
- Worker no-shows must trigger immediate replacement workflow, not just a note field.

#### Main bottlenecks
- Availability is tracked informally by phone or chat, not as structured capacity.
- Operators cannot see why a worker is ineligible without opening multiple records.
- Replacement actions happen outside the system during high-pressure same-day incidents.

#### System requirements
- Eligibility screen must combine availability, compliance, qualification, and client restriction checks in one view.
- Assignment creation must snapshot pay rate, bill rate, shift rule, and site instructions.
- Replacement flow must preserve the failed assignment history and create a linked replacement case.
- Operators need a dispatch board that shows open demand, fill rate, and first-shift risk.

### 3. Pre-Shift Readiness and Day-of-Operation Control

#### Trigger
- Assignment is scheduled to start within a configurable lead window.

#### SOP
1. System sends reminder tasks for missing contracts, missing site briefing acknowledgment, or expired documents.
2. Coordinator confirms worker contactability before start day.
3. Site leader receives expected arrival roster.
4. First-shift arrival is confirmed on the day of work.

#### Critical controls
- first-day arrival confirmation
- replacement standby list
- site-specific onboarding checklist
- emergency escalation contact chain

#### System requirements
- Operators need a day-of-ops roster grouped by site and shift.
- First-shift risk alerts should highlight:
  - unconfirmed worker
  - document expiry
  - missing contract
  - no site contact confirmation

### 4. Attendance Capture and Approval

#### Trigger
- A scheduled shift date is reached or completed.

#### Attendance SOP
1. Planned shift row is generated from assignment schedule.
2. Actual attendance is captured from one source:
   - site manager entry
   - coordinator manual entry from call or chat
   - uploaded sheet
   - external attendance import
3. System compares plan vs actual.
4. Differences create an exception queue.
5. Site leader or authorized operator approves attendance.
6. Approved records become eligible for payroll and billing handoff.

#### Attendance state model
- `planned`
- `captured`
- `exception_pending`
- `site_review_pending`
- `approved`
- `corrected`
- `locked_for_handoff`

#### Exception types that must be explicit
- no-show
- late arrival
- early leave
- overtime
- night shift premium
- break deduction dispute
- wrong site or wrong role worked
- same worker worked without pre-created assignment
- duplicate attendance record
- site did not submit attendance by cutoff

#### Main bottlenecks
- Attendance arrives late from site managers.
- Operators reconcile actuals against paper or chat screenshots.
- Payable time and billable time diverge but no structured reason is captured.

#### System requirements
- Attendance screen must show planned vs actual side by side.
- Every correction needs reason, editor, timestamp, and source evidence.
- Payable and billable adjustments must support separate treatment.
- Cutoff rules must be configurable by client or site.
- Approval lock must prevent downstream silent edits after handoff unless reopened through controlled exception flow.

### 5. Payroll Handoff

#### Trigger
- Attendance period reaches payroll cutoff and payable records are approved.

#### Payroll handoff SOP
1. System groups approved payable attendance by worker and payroll period.
2. Exceptions affecting pay are resolved or marked with explicit payroll treatment.
3. Payroll admin reviews batch summary.
4. Batch is exported or handed off with worker-level details.
5. After handoff, any change creates a post-handoff adjustment case.

#### Required contents of payroll handoff batch
- worker identity key
- assignment and site
- payable dates and hours
- overtime, night, holiday minutes
- allowances or deductions
- unresolved exception flags
- bank or payroll reference
- evidence links when manual correction exists

#### Main bottlenecks
- Attendance closes after payroll cutoff.
- Worker pay adjustments are discussed offline and not reconciled back to the source shift.
- Operators and payroll disagree on which exceptions remain open.

#### System requirements
- Separate payroll cutoff calendar from billing cutoff.
- Payroll batch must freeze a payable snapshot.
- Post-handoff adjustments need delta tracking, not silent overwrite.
- Batch status should include:
  - `draft`
  - `reviewing`
  - `sent_to_payroll`
  - `adjustment_required`
  - `closed`

### 6. Billing Handoff

#### Trigger
- Attendance period reaches billing cutoff and billable records are approved.

#### Billing handoff SOP
1. System groups approved billable attendance by client, site, order, and billing period.
2. Billing admin reviews rate application and exceptions.
3. Manual bill adjustments require a structured reason code.
4. Invoice draft or export package is generated.
5. Client dispute after sending invoice creates a billing exception case tied back to the original attendance rows.

#### Required contents of billing handoff batch
- client and site
- order and assignment references
- billable dates and hours
- rate snapshot and adjustment lines
- tax treatment
- supporting attendance evidence
- dispute notes if any shifts are exceptional

#### Main bottlenecks
- Client-specific invoice formats are handled manually.
- Operators adjust billable quantities in spreadsheets after approval.
- Finance cannot see whether a disputed line came from attendance, assignment, or rate-change error.

#### System requirements
- Billing batch must freeze rate and hour snapshots.
- Finance needs drill-down from invoice line to attendance and assignment history.
- Manual adjustment lines require typed reason codes and approver identity.
- Batch status should include:
  - `draft`
  - `finance_review`
  - `exported`
  - `invoice_sent`
  - `disputed`
  - `closed`

## Cross-Cutting Exception Handling

### High-priority operational exceptions
- urgent same-day order with no worker pool ready
- worker cancels after confirmation
- first-day no-show
- client reduces headcount after workers are already committed
- attendance missing at cutoff
- site disputes overtime after worker already confirmed it
- worker worked but was not formally assigned in system
- client requests retroactive rate change
- payroll already processed but attendance correction arrives later
- invoice already issued but client rejects one or more lines

### Exception handling SOP
1. Operator opens or is assigned an `ExceptionCase`.
2. System classifies the case type and severity.
3. Owner, SLA deadline, and dependent downstream impact are set.
4. If payroll or billing is already handed off, the case is tagged as downstream-impacting.
5. Resolution produces one explicit action:
   - correct source record
   - create adjustment record
   - replace worker
   - cancel remaining shifts
   - escalate to account manager
   - escalate to finance
6. Case is closed only when both operational action and downstream handoff action are complete.

### Exception case fields
- exception type
- severity
- linked entity: order, assignment, attendance, payroll batch, or billing batch
- root cause
- current owner
- target resolution time
- downstream impact flags
- final resolution code

## Operator SOP Checklists

### Order intake checklist
- Is service type clear
- Is the site active and properly configured
- Are rates and overtime rules recorded
- Is attendance approval route defined
- Is billing cycle defined

### Placement checklist
- Is the worker eligible and document-complete
- Has the worker accepted
- Has the site accepted if needed
- Has the assignment snapshot been created
- Has pre-start guidance been sent

### Attendance closure checklist
- Are all planned shifts captured
- Are plan-vs-actual gaps resolved
- Are payable and billable differences explained
- Has site review completed
- Are records locked before handoff

### Payroll handoff checklist
- Are all payable exceptions resolved or explicitly marked
- Are worker-level totals frozen
- Are manual adjustments evidenced
- Has payroll owner accepted the batch

### Billing handoff checklist
- Are all billable exceptions resolved or explicitly marked
- Are rate snapshots correct
- Are invoice adjustments approved
- Is client-specific format ready

## Operational Bottlenecks To Validate In Discovery
- How often same-day orders happen vs planned recurring demand.
- Whether one operator owns both placement and attendance or those are split roles.
- Whether attendance approval is site-led, AM-led, or ops-led by default.
- Whether payroll and billing use the same closed attendance base or diverge routinely.
- Which clients require custom invoice formats or pre-billing statements.
- Whether worker contracts and client documents block placement in practice or are often backfilled later.

## Product Requirements Summary

### Must-have in the first usable version
- Order intake with missing-data gating.
- Worker eligibility and assignment creation with snapshots.
- Day-of-ops dispatch board.
- Attendance capture, comparison, exception queue, and approval.
- Separate payroll and billing handoff batches.
- Structured exception case management with SLA ownership.
- Full audit history for edits, approvals, and downstream adjustments.

### Must not be left implicit in the product
- difference between payable and billable time
- first-day no-show and replacement flow
- cutoff-based locking and post-handoff adjustments
- client-specific operating rules by site
- source evidence for manual corrections

### Metrics to instrument from day one
- order fill rate
- time from order intake to first confirmed worker
- same-day replacement rate
- attendance approval completion before cutoff
- payroll adjustments after handoff
- billing disputes after invoice export
- operator queue size by exception type

## Recommended Product Cut After This Document
- Build the first end-to-end slice around:
  - order intake
  - assignment creation
  - attendance approval
  - billing handoff
- Keep payroll handoff in scope as a structured export and reconciliation module, but do not build a payroll engine in v1.
- Treat exception management as part of the core workflow, not an admin afterthought.

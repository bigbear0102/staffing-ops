# Design Partner Data Onboarding Pack

## Purpose

- Freeze the minimum external inputs required before the first design-partner workflow review.
- Request sample operational data and month-close evidence early enough that the thin slice does not optimize for the wrong exception patterns.
- Separate partner-provided inputs, CEO decisions, and technical follow-up work so the team can tell what is blocked by data access versus product execution.

## Downstream Work This Pack Must Unblock

| Downstream issue | What the open work needs | Required external input from the design partner |
| --- | --- | --- |
| [CMPAAAAAAAA-43](/CMPAAAAAAAA/issues/CMPAAAAAAAA-43) | Freeze the spreadsheet-first finance handoff export contract | real billing export template or spreadsheet, sample month-close rows, batch grouping rules, blocked-row exclusion rules, required trace fields |
| [CMPAAAAAAAA-44](/CMPAAAAAAAA/issues/CMPAAAAAAAA-44) | Build operator review surfaces for override, correction, and billing traceability | examples of how override reasons, correction reasons, approver identity, timestamps, and batch review context are reviewed today |
| [CMPAAAAAAAA-45](/CMPAAAAAAAA/issues/CMPAAAAAAAA-45) | Tighten pilot-reviewable evidence requirements | one realistic fixture set that covers happy path, blocked path, override, correction, and month-close handoff timing |

## Data-Sharing Rules

- Mask names, resident-registration numbers, phone numbers, bank details, and client-confidential pricing if needed, but preserve stable surrogate IDs across files.
- Prefer CSV or XLSX extracts over screenshots. Use screenshots, PDFs, or chat exports only when the current process has no structured system export.
- Every file should include:
  - source system or owner
  - export date
  - period covered
  - site or client scope
  - whether the file shows live data, historical data, or a hand-crafted template
- Relationships must remain reconstructable across `Order`, `Site`, `Worker`, `Assignment`, `Attendance`, and billing export rows.

## Minimum Sample Package

### 1. Order and Site Inputs

| Artifact | Minimum sample | Minimum fields | Why it matters |
| --- | --- | --- | --- |
| Order intake extract | 3 to 5 orders | order id, client, site, service type, role, headcount, shift pattern, start date, end date, bill rate rule, required qualifications, attendance approval route, billing cycle, source channel | anchors the demand side of the thin slice and shows which fields are known before staffing begins |
| Site setup extract | 2 to 3 sites tied to those orders | site id, client id, address or region, site lead role, attendance cutoff, escalation contacts, overtime or premium rules, invoice destination, invoice grouping rule | shows how site-level operating rules and billing rules vary |
| Commercial reference | at least 1 rate card or pricing note | site or client, role, standard rate, overtime rule, holiday rule, transport or meal rule, manual adjustment pattern | needed to validate snapshot fields and export-line pricing context |

### 2. Worker and Assignment Inputs

| Artifact | Minimum sample | Minimum fields | Why it matters |
| --- | --- | --- | --- |
| Worker registry extract | 10 to 20 workers | worker id, role or skill, region, availability status, service-type eligibility, required document status, contract status, deployability blocker reason if any | shows qualification gating and ineligible-worker reasons |
| Assignment extract | 8 to 12 assignments | assignment id, order id, worker id, planned schedule, pay rule snapshot, bill rule snapshot, site instructions, current status, first-shift date | validates the fixed snapshot model between placement and downstream attendance or billing |
| Override or replacement examples | at least 2 cases | source assignment id, override reason or replacement reason, actor, timestamp, linked order or site, resulting status | required for reviewable audit context in [CMPAAAAAAAA-44](/CMPAAAAAAAA/issues/CMPAAAAAAAA-44) |

### 3. Attendance and Exception Inputs

| Artifact | Minimum sample | Minimum fields | Why it matters |
| --- | --- | --- | --- |
| Attendance extract | 20 to 30 rows across one period | attendance id, assignment id, work date, planned start or end, actual start or end, break, payable hours, billable hours, approval status, approver, approval time | proves the happy path from scheduled work to approved attendance |
| Correction examples | at least 2 rows | original values, corrected values, correction reason, evidence reference, actor, timestamp, re-approval state | required for the correction and re-approval path |
| Blocked or exception examples | at least 4 rows | exception type, owner, SLA or cutoff state, blocker reason, downstream hold flag | prevents the product from optimizing only for clean approvals |

Required exception coverage in the sample set:

- one no-show or same-day replacement
- one late or overtime case
- one missing-submission or cutoff breach
- one corrected row after initial submission

### 4. Billing Handoff and Month-Close Inputs

| Artifact | Minimum sample | Minimum fields | Why it matters |
| --- | --- | --- | --- |
| Billing export template | 1 blank or reusable template | column names, required formats, grouping logic, rounding rules, required identifiers, manual adjustment columns | the baseline contract for [CMPAAAAAAAA-43](/CMPAAAAAAAA/issues/CMPAAAAAAAA-43) |
| Completed month-close export | 1 real or masked file | export batch id if any, billing period, client, site, source attendance ids or equivalent trace key, source assignment ids or equivalent trace key, rate columns, quantities, generated time, actor or owner | shows what finance actually needs at handoff |
| Adjustment or dispute example | at least 1 case | original line, adjustment line or dispute note, reason code, actor, date, whether invoice was already sent | required for post-handoff review and audit design |
| Month-close calendar note | 1 per partner | attendance cutoff date, finance review date, invoice send date, dispute window, who owns each step | needed for pilot proof timing and release-gate realism |

## Interview Guide

### Approval SLA and ownership

- Who is allowed to approve attendance for each service type and site?
- What is the expected SLA between shift end and attendance approval?
- What happens when site submission misses cutoff?
- Which exceptions can operations resolve alone, and which require finance or account-manager review?

### Attendance correction path

- Who is allowed to correct attendance after submission and after approval?
- What typed reason or evidence is required today?
- Are original values preserved anywhere reviewable, or are they overwritten?
- How are post-close corrections handled for payroll versus billing impact?

### Placement override and replacement review

- What situations justify a placement override or replacement?
- Who reviews override-worthy decisions, and how quickly?
- Where are override reasons captured today: chat, spreadsheet note, ERP note, email, or nowhere?
- What fields must remain visible later when a reviewer asks why a worker was placed or replaced?

### Month-close and finance handoff

- What file or system is the final billing handoff artifact?
- Which columns are mandatory for finance or the client to accept the handoff?
- How are blocked or disputed attendance rows excluded from the export?
- Which manual adjustments are common enough that the first export contract should model them explicitly?
- What is the current dispute loop after invoice send?

## Finance Artifact Request Checklist

Request the finance-side artifacts together, not one at a time:

- latest blank billing spreadsheet or invoice-upload template
- one completed month-close export or invoice-prep sheet
- one example with manual adjustment or dispute handling
- column-by-column explanation for any field that is not obvious from the header
- description of how finance traces a row back to site, worker, shift, and approval evidence
- note on whether the current handoff is per client, per site, per billing period, or mixed

## Intake Checklist

### Collected

- [ ] Named design partner confirmed, with primary operations contact and finance contact.
- [ ] NDA or data-sharing constraints confirmed.
- [ ] Order intake sample received.
- [ ] Site setup sample received.
- [ ] Worker registry sample received.
- [ ] Assignment sample received.
- [ ] Attendance sample received.
- [ ] Correction and blocked-path examples received.
- [ ] Billing export template received.
- [ ] Completed month-close export or equivalent finance handoff example received.
- [ ] Month-close calendar and owner map captured.

### Missing

- [ ] Stable IDs are missing across one or more files and need partner clarification.
- [ ] Attendance approval owner or SLA is still unclear.
- [ ] Correction reason taxonomy is missing.
- [ ] Override or replacement review evidence is missing.
- [ ] Finance export is available only as an image or PDF and needs column clarification.
- [ ] Blocked-row handling in month-close is still unclear.
- [ ] Post-invoice dispute workflow is still unclear.

### CEO-Needed Decisions

- [ ] Confirm which design partner should be prioritized first if multiple candidates are available.
- [ ] Confirm the minimum acceptable data access level: masked historical data only, live shadowing, or both.
- [ ] Confirm whether the first pilot should optimize first for export fidelity, operator reviewability, or speed-to-access if tradeoffs emerge.
- [ ] Confirm whether the team can ask for live month-close observation in addition to static sample files.
- [ ] Confirm whether the first partner must provide both operations and finance contacts before onboarding starts.

### Technical Follow-Ups After Collection

- [ ] Convert partner files into named fixture sets for review and regression use.
- [ ] Map billing-template columns into the first export contract for [CMPAAAAAAAA-43](/CMPAAAAAAAA/issues/CMPAAAAAAAA-43).
- [ ] Map override, correction, actor, and batch-summary fields into the operator review surface for [CMPAAAAAAAA-44](/CMPAAAAAAAA/issues/CMPAAAAAAAA-44).
- [ ] Update the pilot evidence matrix with real exception and month-close timings from the partner workflow.
- [ ] Record any missing identifiers or manual reconciliation steps that should stay explicit non-goals for v1.

## Exit Criteria For Onboarding Readiness

The onboarding pack is ready when all of the following are true:

- the team has one coherent sample set that links order, site, worker, assignment, attendance, and billing handoff
- at least one blocked path, one correction path, and one override or replacement path are represented in the sample set
- finance has provided either a blank export template plus one completed example, or an equivalent spreadsheet-friendly handoff artifact
- CEO decisions above are resolved or explicitly deferred with a named owner and date
- the team can point to which collected partner evidence feeds [CMPAAAAAAAA-43](/CMPAAAAAAAA/issues/CMPAAAAAAAA-43), [CMPAAAAAAAA-44](/CMPAAAAAAAA/issues/CMPAAAAAAAA-44), and [CMPAAAAAAAA-45](/CMPAAAAAAAA/issues/CMPAAAAAAAA-45)

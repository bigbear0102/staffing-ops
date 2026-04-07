# Staffing Operations UX Direction

## Related Artifacts
- Workflow contract: `docs/staffing-ops-user-flows.md`
- Screen blueprint: `docs/staffing-ops-screen-blueprint.md`
- Operating workflow map: `docs/staffing-ops-workflow-map.md`
- Domain and architecture reference: `docs/staffing-ops-architecture.md`

## UX Decision Summary
- Primary v1 persona: `Operations Coordinator`.
- Secondary personas: `Account Manager`, `Finance Admin`.
- Product shape: workflow-first internal operations OS, not a loose collection of CRUD pages.
- Main loop: `Order intake -> worker qualification and matching -> assignment placement -> attendance approval -> invoice handoff`.
- Key UX stance: operators should work from queues, exceptions, and next actions before they drill into records.

## Persona Model

### 1. Operations Coordinator
- Owns the day-to-day operating loop from open demand to approved attendance.
- Needs speed, dense data, and a clear sense of what is blocked now.
- Main jobs:
  - create and update orders
  - find eligible workers
  - complete placements
  - resolve compliance gaps
  - approve or correct attendance exceptions

### 2. Account Manager
- Owns the commercial relationship and client/site context.
- Needs visibility into open orders, fill risk, client-specific requirements, and delivery progress.
- Main jobs:
  - maintain client and site information
  - confirm service requirements and rates
  - monitor whether orders are staffed on time

### 3. Finance Admin
- Owns the billing handoff and invoice-quality gate.
- Needs confidence that attendance is approved, snapshots are stable, and adjustments are explicit.
- Main jobs:
  - review billing-period drafts
  - inspect line-item composition
  - apply manual adjustments with reasons
  - export or hand off invoices

## UX Principles
- Queue-first, record-second. Land users in actionable work queues before master data pages.
- Exception-first visibility. Missing compliance, underfilled orders, attendance mismatches, and blocked invoice drafts should be visible at the top level.
- One-screen resolution. Common approvals and corrections should happen in-table or in a side panel, not across deep navigation.
- Snapshot clarity. Whenever rate, schedule, or billing values are snapshotted, show both source context and "locked for billing" state.
- Dense but readable. Prefer tables, split views, sticky summaries, and inline status chips over airy marketing-style layouts.
- Progressive disclosure. Show the next decision first, and reveal audit detail, documents, and historical context in tabs or drawers.
- Audit always nearby. Every operational detail view should expose a recent activity timeline and "who changed what" summary.

## Information Architecture

### Primary Navigation
1. `Work Queue`
2. `Demand`
3. `Workforce`
4. `Placement`
5. `Attendance`
6. `Billing`

### Secondary Navigation And Utilities
- `Clients & Sites` under `Demand`
- `Workers` and `Compliance` under `Workforce`
- `Assignments` under `Placement`
- `Documents` and `Audit` as contextual tabs on detail pages, not primary top-level items in v1

### Why This IA
- It mirrors the actual operating loop instead of the database schema.
- It keeps the highest-frequency tasks in first-level navigation.
- It avoids over-promoting supporting systems like documents or audit into the main workflow rail.

## Core Screen Structure

### 1. Operations Home / Work Queue
Purpose:
- Single landing page for coordinators and managers.

Structure:
- Header with date, user context, and organization scope.
- KPI row:
  - open orders
  - unfilled headcount
  - workers blocked by compliance
  - attendance exceptions awaiting review
  - invoice drafts blocked
- Action queues:
  - `Needs staffing`
  - `Compliance missing`
  - `Attendance exceptions`
  - `Ready for invoice handoff`
- Right-side alerts rail:
  - expiring documents
  - assignment start dates approaching
  - client-specific requirement warnings

### 2. Demand Workspace
Purpose:
- Manage client accounts, sites, and staffing orders.

Structure:
- Left list: client/site/order tree with filters.
- Center list: orders table with status, role, headcount, date range, fill progress, and risk.
- Right detail panel:
  - order summary
  - site requirements
  - bill rate and overtime rules
  - linked contracts
  - recent activity

Key UX behavior:
- `Create order` should open a structured editor, not a raw form wall.
- Order detail should always show fill status and the next recommended action.

### 3. Order Intake Editor
Purpose:
- Enter and validate a staffing request with minimal backtracking.

Structure:
- Step group or section stack:
  - client and site
  - role and headcount
  - schedule and date range
  - rate and overtime rules
  - required qualifications
  - review and publish
- Sticky right summary:
  - completeness checklist
  - estimated staffing difficulty
  - blocking fields

Key UX behavior:
- Inline validation, not end-of-form surprise errors.
- Reusable site defaults should prefill repeated fields.
- Draft vs published state must be explicit.

### 4. Worker Registry Workspace
Purpose:
- Maintain worker records and readiness for placement.

Structure:
- Worker table with filters for skill, qualification, location, status, and availability.
- Profile summary header with identity status, qualification status, compliance score, and current assignment state.
- Tab set:
  - profile
  - qualifications
  - compliance documents
  - assignments
  - attendance history

Key UX behavior:
- Readiness should be summarized as a visible badge:
  - `Ready`
  - `Missing docs`
  - `Qualification review`
  - `Inactive`
- Expiring artifacts need date-based warnings with clear actions.

### 5. Matching And Placement Board
Purpose:
- Resolve one order into one or more staffed assignments.

Structure:
- Left panel: order requirement summary and gaps.
- Center panel: ranked candidate list with filters.
- Right panel: candidate detail and placement action box.

Candidate row content:
- qualification fit
- compliance status
- availability match
- recent assignment history
- risk flags

Placement action box:
- assignment period
- schedule snapshot
- pay rate snapshot
- linked contract/doc requirements
- confirm placement

Key UX behavior:
- This should be a compare-and-decide workspace, not a generic assignment form.
- The operator must see why a candidate is blocked without leaving the screen.
- Replacement flow should reuse the same board with previous assignment context visible.

### 6. Assignment Detail
Purpose:
- Act as the stable operating record after placement.

Structure:
- Header with worker, site, order, assignment status, and key dates.
- Snapshot cards:
  - schedule
  - pay rate
  - bill rate
  - source channel
- Tabs:
  - attendance
  - documents
  - audit
  - replacement history

Key UX behavior:
- Clearly separate snapshotted fields from live upstream order fields.
- Show all downstream dependencies before cancellation or reassignment.

### 7. Attendance Approval Queue
Purpose:
- Let coordinators approve shifts at scale while catching exceptions.

Structure:
- Filter bar for date, client, site, order, exception type, approval state.
- Main table:
  - worker
  - assignment
  - scheduled start/end
  - actual start/end
  - break
  - overtime
  - source
  - exception flag
  - approval state
- Side drawer for correction:
  - editable attendance values
  - reason code
  - approval notes
  - audit history

Key UX behavior:
- Bulk approve clean rows.
- Force explicit review on exceptions.
- Never let a corrected row lose the original submitted values.

### 8. Billing Handoff Workspace
Purpose:
- Convert approved attendance into invoice-ready output.

Structure:
- Billing period selector and client filter.
- Draft invoice list with readiness status.
- Invoice detail view:
  - line items
  - source attendance rows
  - assignment rate snapshots
  - manual adjustments
  - export state

Key UX behavior:
- Finance should be able to trace any line back to attendance and assignment source.
- Manual adjustments must require reason entry and remain visibly separate from generated lines.
- Export/handoff status should be obvious and immutable once completed.

## End-To-End UX Flow

### Flow 1. Client Order Intake
1. Operator lands in `Work Queue` and sees open demand.
2. Opens `Create order` from the demand queue or client/site context.
3. Completes structured order sections with inline validation.
4. Publishes the order.
5. Order moves automatically into `Needs staffing`.

### Flow 2. Worker Qualification And Matching
1. Operator opens an underfilled order from the queue.
2. Matching board shows ranked workers and blockers.
3. Operator resolves missing documents or chooses an eligible worker.
4. Confirms placement and creates the assignment snapshot.
5. Assignment appears in active placement tracking.

### Flow 3. Attendance Approval
1. Shift records arrive into the attendance queue.
2. Clean rows are bulk approved.
3. Exception rows open in the correction drawer.
4. Operator applies reasoned corrections and approval.
5. Approved rows become billing-eligible.

### Flow 4. Invoice Handoff
1. Finance opens a billing period and reviews draft invoice readiness.
2. Any missing attendance approvals or snapshot gaps are surfaced first.
3. Draft lines are reviewed, traced, and adjusted if needed.
4. Invoice is exported or handed off with explicit status.

## Input And Review UX Rules
- All critical forms should use section-based editors with sticky summaries.
- Reviews should happen in tables with side drawers, not stacked detail pages.
- Required file uploads should be visible as checklist items tied to operational blockers.
- Status transitions should require explicit intent only when they change downstream consequences.
- Every approval surface should expose:
  - current status
  - blocking conditions
  - effect of approval
  - recent audit events

## Recommended Default Views By Role
- Operations Coordinator default landing: `Work Queue`.
- Account Manager default landing: `Demand` filtered to owned accounts and sites.
- Finance Admin default landing: `Billing` filtered to current period draft invoices.

## V1 UX Quality Bar
- A coordinator can move from an open order to a confirmed placement without opening more than three primary screens.
- Attendance review can approve clean shifts in bulk and resolve exceptions inline.
- Finance can explain any invoice line without spreadsheet side work.
- Missing compliance never appears as hidden data debt; it is shown as an explicit blocker in matching and assignment views.

## Recommendation On Open Product Decision
- The first workflow owner persona should be `Operations Coordinator`.
- Reason:
  - this persona touches every step of the wedge
  - this gives the product one primary UX spine
  - account manager and finance views can remain thinner role variants around the same operating model

## PM And Engineering Handoff
- Use this document as the UX stance and IA overview.
- Use `docs/staffing-ops-user-flows.md` to define backlog slices, acceptance criteria, and workflow state rules.
- Use `docs/staffing-ops-screen-blueprint.md` to scope screen structure, shared patterns, and dense operator interaction behavior.
- Keep workflow questions and screen questions separate during planning to avoid mixing state logic with layout debate.

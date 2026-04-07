# Staffing Operations Screen Blueprint

## Purpose
- Define the information architecture, workspace types, and interaction model for the staffing operations MVP.
- Keep screen structure distinct from workflow sequencing so Product Manager and engineering can scope UI slices with less ambiguity.

## Product Shape
- Internal operations OS for Korean dispatch, staffing, and outsourcing teams.
- Desktop-first dense admin product for trained back-office users.
- Workflow-first navigation where queues and exceptions are first-class.

## Screen Architecture Principles
- Start from the next action. Default landings should expose actionable queues and blockers.
- Keep context visible. Operators should not lose order, worker, or assignment context while reviewing details.
- Prefer split views. Use tables plus drawers or side panels for high-frequency review tasks.
- Show locked vs live values clearly. Snapshotted operational data must look different from editable source data.
- Design for correction, not perfection. Every high-risk workflow needs a visible recovery path.

## Information Architecture

### Primary Navigation
1. `Work Queue`
2. `Demand`
3. `Workforce`
4. `Placement`
5. `Attendance`
6. `Billing`

### Secondary Navigation
- `Clients & Sites` inside `Demand`
- `Compliance` inside `Workforce`
- `Assignments` inside `Placement`
- `Documents`
- `Audit`

### Utility Layer
- global search
- saved filters
- organization and period scope
- alert center
- quick-create menu for order, worker, and exception case

## Core Workspace Types

### 1. Queue Workspace
Use for:
- `Work Queue`
- `Attendance`
- `Billing` readiness list

Structure:
- page header with title, date scope, and summary chips
- sticky filter bar
- KPI or queue counts row
- main table
- side drawer for review and correction

Interaction rules:
- sorting defaults to urgency and blocker severity
- row click opens contextual drawer, not full navigation, unless the task requires deep editing
- bulk actions stay visible only when the selection is valid

### 2. Management Workspace
Use for:
- `Demand`
- `Workforce`

Structure:
- left index or saved-view rail
- center table or list
- right detail panel
- optional tabs inside the detail panel

Interaction rules:
- creation starts from the list context
- record switching should preserve filters and table position
- status, owner, and recent activity must be visible without opening a secondary page

### 3. Decision Board Workspace
Use for:
- `Placement`

Structure:
- left requirement summary
- center ranked comparison list
- right candidate detail plus commit box

Interaction rules:
- operators compare multiple candidates without losing the selected order summary
- blockers must be visible in the candidate row and in the detail panel
- confirm action must preview downstream effects on assignment and fill state

### 4. Detail Record Workspace
Use for:
- `Assignment detail`
- complex order detail

Structure:
- strong summary header
- snapshot cards for locked values
- tabs for related subdomains
- activity timeline rail or footer

Interaction rules:
- use this view only after the operator has committed to one record
- tab switching must not hide status or blocking conditions
- destructive actions require impact preview

## Global Navigation Behavior
- `Work Queue` is the default landing for operations-heavy roles.
- Role-based defaults:
  - `Operations Coordinator` -> `Work Queue`
  - `Account Manager` -> `Demand`
  - `Finance Admin` -> `Billing`
- Global search should resolve entities and direct users to either the relevant workspace or the precise detail record.
- Breadcrumbs should reflect the workflow context, not only the database hierarchy.

## Screen Blueprint By Area

### Work Queue
Goal:
- one control tower for what needs attention now

Blocks:
- KPI row for open demand, blocked workers, attendance exceptions, invoice blockers
- stacked action queues by workflow stage
- alert rail for expiring artifacts and approaching starts

Must show:
- item owner
- urgency
- blocker reason
- next action label

### Demand Workspace
Goal:
- manage client and site context plus order inventory

Blocks:
- client/site/order navigator
- orders table with fill progress and risk
- order summary panel
- contextual actions for create, edit, clone, publish, and match

Must show:
- order completeness
- current fill state
- commercial confidence
- recent activity

### Order Intake Editor
Goal:
- convert messy inbound demand into a staffable order

Blocks:
- section stack for client/site, staffing need, schedule, rate rules, qualifications, review
- sticky right summary with checklist and blockers

Must show:
- inherited site defaults vs manual overrides
- draft vs published state
- missing blockers in human language

### Workforce Workspace
Goal:
- manage worker readiness at a glance

Blocks:
- filter-heavy worker table
- profile summary header
- tabs for qualifications, compliance, assignments, attendance history

Must show:
- readiness badge
- expiry warnings
- current assignment load

### Matching And Placement Board
Goal:
- compare candidates and confirm assignment with minimal context switching

Blocks:
- order requirement card
- ranked candidate list
- candidate detail panel
- placement commit box

Must show:
- fit score or ranking rationale
- compliance blocker state
- availability conflict
- assignment snapshot preview

### Assignment Detail
Goal:
- stable operational record after placement

Blocks:
- summary header
- snapshot cards
- tabs for attendance, documents, audit, replacement history

Must show:
- locked rate and schedule values
- downstream dependencies before reassignment or cancellation

### Attendance Queue
Goal:
- high-throughput review and correction

Blocks:
- filter bar
- dense comparison table for planned vs actual
- correction drawer
- bulk action strip

Must show:
- original submitted values
- edited values
- exception code
- approval status
- source

### Billing Workspace
Goal:
- translate approved shifts into invoice-ready drafts

Blocks:
- billing period selector
- draft list with readiness status
- invoice detail split view
- export state panel

Must show:
- blocker summary
- trace-back to attendance and assignment
- manual adjustment reason trail

## Shared Interaction Components

### Status Chips
- Use for lifecycle, readiness, and exception states.
- Differentiate:
  - progress state
  - risk state
  - locked state

### Sticky Summary Panels
- Use in complex editors and detail views.
- Summaries should answer:
  - what record is this
  - what is incomplete
  - what happens next

### Side Drawers
- Use for review, correction, and lightweight edits.
- Avoid using drawers for long multi-step creation flows.

### Timelines
- Show recent audit and decision history near the current record.
- Keep the timeline operational, not verbose. Focus on meaningful state changes and owner changes.

## Error Prevention And Throughput Rules
- Prevent invalid bulk actions by default instead of explaining failures after click.
- Show the exact blocker reason on the row where the problem exists.
- Make urgency and deadline visible without opening detail.
- Preserve filter and scroll state when operators inspect and return from a record.
- Require reason codes on any change that affects payable time, billable time, or irreversible export state.

## UX Quality Checklist For PM And Engineering
- Can the user start from the right queue for this job?
- Can the user compare options without opening multiple full pages?
- Are blockers and missing prerequisites visible before commit?
- Are original values preserved when corrections happen?
- Is the downstream impact of a decision visible before confirmation?
- Does the screen support high-volume operator work without unnecessary modal depth?

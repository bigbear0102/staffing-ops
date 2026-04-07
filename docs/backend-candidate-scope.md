# Backend Candidate Scope

## Purpose
- This document defines the backend scope for the current top product candidates from a CTO perspective.
- The candidate set is provisional until sibling outputs from operations, market, and product prioritization are finalized.
- The backend recommendation already aligns with the current architecture and MVP wedge documents in this workspace.

## Provisional Top 3 Candidates
1. Internal operations OS for dispatch and staffing teams.
2. Timesheet-to-invoice back-office automation.
3. Compliance and contract document control system.

## Candidate 1. Internal Operations OS

### Problem slice
- Cover the full internal workflow from order intake to assignment, attendance approval, and invoice handoff.
- Primary users are operations coordinators, account managers, and finance admins.

### Required data model
- `Organization`
- `OperatorUser`
- `ClientAccount`
- `Site`
- `Order`
- `Worker`
- `Assignment`
- `Attendance`
- `Invoice`
- `InvoiceLineSnapshot`
- `Contract`
- `ComplianceArtifact`
- `DocumentFile`
- `AuditEvent`
- `OutboxJob`

### API scope
- `POST /client-accounts`, `GET /client-accounts/:id`
- `POST /sites`, `GET /sites/:id`
- `POST /orders`, `PATCH /orders/:id/status`
- `POST /workers`, `PATCH /workers/:id`
- `POST /assignments`, `PATCH /assignments/:id/status`
- `POST /attendance/import`
- `POST /attendance/:id/approve`
- `POST /invoices/draft`
- `POST /invoices/:id/export`
- `POST /documents/upload`
- `GET /audit-events`

### Workflow engine shape
- Do not build a generalized BPM engine in v1.
- Use domain-specific state machines with explicit transition guards.
- Minimum state machines:
- `Order`: `draft -> open -> partially_filled -> filled -> closed | cancelled`
- `Assignment`: `proposed -> confirmed -> active -> completed | replaced | cancelled`
- `Attendance`: `captured -> submitted -> approved | rejected | corrected`
- `Invoice`: `draft -> approved -> exported | void`
- Every transition writes an audit event and emits an outbox record if downstream work is needed.

### Auth and permission model
- Internal staff only in v1.
- RBAC roles:
- `admin`
- `operations_manager`
- `operations_operator`
- `finance_admin`
- `viewer`
- Object-level permission is limited to organization scope in v1.
- Approval actions should require stronger roles than create or edit actions.

### Operating logic
- Snapshot bill rate and pay rate on `Assignment`.
- Derive invoice lines from approved `Attendance`, never from mutable live joins.
- Support exception queues for no-show, overtime, schedule mismatch, and missing compliance.
- Trigger background jobs for:
- compliance expiry reminders
- invoice draft generation
- export retries
- file processing

### Delivery difficulty
- High.
- This is the largest scope, but it creates the canonical model that future products reuse.
- The architecture already chosen in the workspace is sufficient for this cut.

## Candidate 2. Timesheet-to-Invoice Automation

### Problem slice
- Start later in the workflow and focus on converting approved time records into billing output.
- Primary users are finance admins and senior operators.

### Required data model
- `Organization`
- `OperatorUser`
- `ClientAccount`
- `Site`
- `Worker`
- `TimesheetImportBatch`
- `WorkLog`
- `ReconciliationCase`
- `BillingRule`
- `Invoice`
- `InvoiceAdjustment`
- `ExportJob`
- `AuditEvent`

### API scope
- `POST /timesheets/import`
- `GET /timesheets/reconciliation-queue`
- `POST /worklogs/:id/approve`
- `POST /invoice-batches/draft`
- `POST /invoice-batches/:id/finalize`
- `POST /exports/accounting`

### Workflow engine shape
- Narrower than candidate 1.
- Minimum states:
- `TimesheetImportBatch`: `uploaded -> parsed -> reconciled -> completed | failed`
- `WorkLog`: `raw -> matched -> approved | rejected`
- `Invoice`: `draft -> approved -> exported | void`
- Queue handlers must be idempotent because file imports and export retries will repeat.

### Auth and permission model
- Internal staff only.
- Roles can be reduced to `finance_admin`, `operations_manager`, and `viewer`.
- Fewer permission branches than candidate 1.

### Operating logic
- Main complexity sits in import normalization, duplicate detection, mismatch handling, and adjustment traceability.
- Still needs immutable invoice snapshots and audit logs.
- Upstream demand and placement remain weakly modeled, which limits later automation.

### Delivery difficulty
- Medium.
- Easier to ship than candidate 1, but structurally weaker because it depends on messy upstream sources.

## Candidate 3. Compliance and Contract Control

### Problem slice
- Centralize document collection, verification, expiry tracking, and contract revision handling.
- Primary users are operations admins and compliance reviewers.

### Required data model
- `Organization`
- `OperatorUser`
- `Worker`
- `ClientAccount`
- `Site`
- `Order`
- `Contract`
- `ComplianceArtifact`
- `ArtifactRequirementRule`
- `VerificationReview`
- `ReminderJob`
- `DocumentFile`
- `AuditEvent`

### API scope
- `POST /artifacts`
- `POST /artifacts/:id/verify`
- `POST /contracts`
- `PATCH /contracts/:id/status`
- `GET /requirements/:ownerType/:ownerId`
- `GET /expiry-dashboard`
- `POST /documents/upload`

### Workflow engine shape
- Focus on verification and expiry rather than staffing throughput.
- Minimum states:
- `ComplianceArtifact`: `missing -> submitted -> verified | rejected | expired`
- `Contract`: `draft -> sent -> signed | superseded | expired`
- Jobs handle reminders and expiration transitions.

### Auth and permission model
- Internal staff only in v1.
- Roles:
- `compliance_admin`
- `operations_manager`
- `viewer`
- Verification rights should be isolated from general editing.

### Operating logic
- Typed artifact rules matter more than free-form file storage.
- Revision history and immutable file references are mandatory.
- This candidate creates reusable foundations, but it does not solve the core daily workflow alone.

### Delivery difficulty
- Medium.
- More contained than candidate 1, but weaker as the first product wedge because it is not the main operating loop.

## Cross-Candidate Backend Decisions
- Keep a TypeScript modular monolith.
- Use `Postgres` as the source of truth.
- Use `S3-compatible` object storage for contracts, artifacts, and exports.
- Use an outbox plus background jobs instead of synchronous side effects.
- Store audit events as append-only records.
- Avoid generalized workflow engines, event buses, or microservices in v1.
- Design APIs around operator tasks and state transitions, not CRUD-only resource exposure.

## Recommendation
- Backend first choice remains candidate 1: internal operations OS.
- Candidate 2 should be treated as a phase-2 billing module inside the same platform, not a separate first product.
- Candidate 3 should be treated as a shared support module that is built only where required for the initial workflow.

## Suggested MVP Backend Cut
- Phase 1:
- `ClientAccount`, `Site`, `Order`
- `Worker`, `Assignment`
- `Attendance`
- audit and document upload
- Phase 2:
- invoice draft generation and export
- compliance artifact expiry checks
- exception queues and retry jobs

## Main Risks
- If the PM output picks a different top candidate, some module names may need to change, but the current canonical entities still hold up.
- If assignment snapshots are skipped, invoice accuracy and auditability will break.
- If approval transitions are implemented as ad hoc boolean flags instead of state machines, exception handling will sprawl quickly.

## Immediate Next Step
- Keep candidate 1 as the backend default unless [CMPAAAAAAAA-18](/CMPAAAAAAAA/issues/CMPAAAAAAAA-18) explicitly changes the top-product ranking after market and operations synthesis.

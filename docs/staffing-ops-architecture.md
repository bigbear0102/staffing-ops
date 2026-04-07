# Staffing Operations Domain Model and Architecture

## Scope
- First product wedge: internal operations system for Korean dispatch, staffing, and outsourcing teams.
- First workflow: client order intake -> worker qualification and placement -> attendance capture -> invoice handoff.
- Primary users: internal operators, account managers, and finance admins.
- Detailed workflow, SOP, bottleneck, and exception mapping lives in `docs/staffing-ops-workflow-map.md`.

## Canonical Domain Model

### Root and supporting entities
- `Organization`: top-level tenant boundary for future multi-company support. Every operational record belongs to one organization.
- `OperatorUser`: internal user who creates, approves, or edits operational records.
- `DocumentFile`: immutable file record stored in object storage and linked from contracts or compliance artifacts.
- `AuditEvent`: append-only change log for every state transition and critical data mutation.

### Core operational entities
- `ClientAccount`
  - Represents a customer company or business unit.
  - Key fields: legal name, business registration number, billing profile, contract status, default invoicing terms, owner.
  - Relationships: has many `Site`, `Order`, `Invoice`, `Contract`.

- `Site`
  - Represents a physical workplace or operating location under a client account.
  - Key fields: client account id, site name, address, manager contact, required qualifications, operating calendar.
  - Relationships: belongs to `ClientAccount`; has many `Order`, `Assignment`, `Attendance`.

- `Order`
  - Represents a staffing request or service order from a client for a site and time period.
  - Key fields: client account id, site id, role, headcount, start and end date, shift pattern, bill rate, overtime rules, status.
  - Relationships: belongs to `ClientAccount` and `Site`; has many `Assignment`; may reference one or more `Contract`.

- `Worker`
  - Represents a person who may be placed on assignments.
  - Key fields: legal identity, contact info, residency or visa status, skill tags, qualification status, bank or payroll reference, active status.
  - Relationships: has many `Assignment`, `Contract`, `ComplianceArtifact`.

- `Assignment`
  - Canonical join between one worker and one order for a bounded period.
  - Key fields: worker id, order id, site id snapshot, planned schedule, pay rate snapshot, bill rate snapshot, assignment status, source channel.
  - Relationships: belongs to `Worker`, `Order`, and `Site`; has many `Attendance`; may reference one or more `Contract`.
  - Rule: rate and schedule fields are snapshotted at assignment time so invoices remain stable even if the order changes later.

- `Contract`
  - A typed legal agreement or terms package linked to the relevant commercial relationship.
  - Key fields: contract type, effective dates, counterparties, signature status, revision number, linked file id.
  - Initial contract types:
    - `client_master_agreement`
    - `client_order_addendum`
    - `worker_employment_agreement`
    - `worker_dispatch_consent`
  - Relationships: may belong to `ClientAccount`, `Worker`, and optionally `Assignment` or `Order`.

- `Attendance`
  - Daily or shift-level proof that an assigned worker worked planned time.
  - Key fields: assignment id, work date, scheduled start or end, actual start or end, break minutes, overtime minutes, attendance source, approval status, exception code.
  - Relationships: belongs to `Assignment`; inherits worker, order, and site through the assignment.
  - Rule: only approved attendance can flow into invoice calculation.

- `Invoice`
  - Billing output for a client account for a closed billing period.
  - Key fields: client account id, billing period, invoice number, currency, subtotal, tax, total, status, exported at.
  - Relationships: belongs to `ClientAccount`; aggregates approved `Attendance` rows through invoice line snapshots.
  - Rule: invoice generation produces immutable line-item snapshots from attendance and assignment rates.

- `ComplianceArtifact`
  - Any document or structured evidence required for legal, contractual, or safety compliance.
  - Key fields: artifact type, owner type, owner id, issue date, expiry date, verification status, linked file id.
  - Initial artifact types:
    - identity verification
    - visa or residency proof
    - required license or certification
    - safety training acknowledgment
    - health check or onboarding form
    - client-specific mandatory document
  - Relationships: most often belongs to `Worker`, but can also attach to `ClientAccount`, `Site`, `Order`, or `Assignment`.

## Relationship Summary
- `ClientAccount` 1:N `Site`
- `ClientAccount` 1:N `Order`
- `ClientAccount` 1:N `Invoice`
- `Site` 1:N `Order`
- `Order` 1:N `Assignment`
- `Worker` 1:N `Assignment`
- `Assignment` 1:N `Attendance`
- `ClientAccount` and `Worker` 1:N `Contract`
- `Worker` and other domain records 1:N `ComplianceArtifact`

## Domain Rules
- Every operational record is scoped to one `Organization`.
- `Assignment` is the source of truth for worker-to-order placement. Attendance and invoicing never link directly to `Worker` plus `Order` without an assignment.
- `Attendance` must be approvable and correctable, but all corrections are audit-trailed.
- `Invoice` is derived, not hand-authored. Manual adjustments exist as explicit adjustment lines with reasons.
- `ComplianceArtifact` verification must support expiry and reminder workflows.
- Contracts and compliance files are immutable at the file layer; edits create new revisions.

## Module Boundaries
- `crm_accounts`: client accounts, contacts, sites.
- `order_intake`: orders, demand details, staffing requirements.
- `worker_registry`: worker profiles, qualifications, availability flags.
- `placement`: assignments, assignment lifecycle, replacements.
- `attendance`: attendance capture, approval, exceptions.
- `billing`: invoice generation, adjustments, exports.
- `compliance`: artifact registry, expiry checks, verification.
- `documents`: file storage, metadata, revision tracking.
- `audit`: append-only event log and operator activity history.
- `integration_outbox`: outbound events, MCP actions, webhooks, and batch exports.

## System Architecture

### Chosen initial architecture
- TypeScript modular monolith.
- `Postgres` as the primary system of record.
- `React` admin application for internal operations UI.
- `Node.js` API layer in the same repository and deployment unit as the admin app.
- `Postgres-backed job queue` for reminders, invoice generation, document processing, and integration retries.
- `S3-compatible object storage` for contracts, compliance files, and exports.
- `Append-only audit log` table for all critical mutations.
- `Integration and MCP adapter layer` exposed as internal modules plus outbox jobs, not separate services.

### Why this cut
- One team can ship and operate it.
- The main risk is unclear workflow fit, not scaling bottlenecks.
- Postgres covers relational data, queue coordination, reporting seeds, and auditability with minimal infrastructure.
- A modular monolith preserves clean future service boundaries without premature distributed systems work.

## Initial technical decisions
- API style: internal JSON API first, designed around task-oriented endpoints for admin operations.
- Data access: strict module ownership over tables; cross-module reads use explicit query services or snapshots.
- Jobs: idempotent handlers only. Every external side effect must be retriable from the outbox.
- Files: metadata in Postgres, binary objects in storage, signed URLs for controlled access.
- Search and reporting: Postgres full-text and read replicas are enough initially. No separate search engine yet.
- Auth: internal staff authentication only in v1. External client or worker access is deferred.

## First build constraints
- Country fixed to South Korea in v1.
- Timezone fixed to `Asia/Seoul`.
- Currency fixed to `KRW`.
- Internal admin users only; no worker or client self-service app yet.
- Manual override is required for attendance corrections, invoice adjustments, and compliance verification.
- One primary workflow must work end-to-end before adding adjacent modules.

## Non-goals
- No microservices.
- No payroll or tax engine in v1.
- No worker marketplace or auto-matching engine in v1.
- No external client portal or worker mobile app in v1.
- No generalized BPM or low-code platform layer.
- No real-time GPS attendance or biometric hardware integration in v1.

## MVP delivery sequence
1. Client accounts, sites, and order intake.
2. Worker registry and compliance artifact tracking.
3. Assignment lifecycle and placement views.
4. Attendance approval workflow with exception handling.
5. Invoice draft generation and export handoff.
6. Alerting and MCP-backed integration actions.

## Main risks
- If the product wedge broadens beyond one operational workflow, the domain model will sprawl before it is validated.
- If assignment snapshots are not enforced, attendance and invoice history will drift when upstream records change.
- If compliance is modeled as free-form files instead of typed artifacts, automation and expiry management will break early.

## Open follow-up decisions
- Exact first workflow owner persona: account manager vs. operations coordinator.
- Invoice export target: spreadsheet-first vs. ERP connector-first.
- Whether client contracts and worker contracts require separate approval workflows in v1 or share one revision model.

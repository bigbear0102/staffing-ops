# Outsourcing MVP Candidates and GitHub Technical Plan

## Purpose

- Close the technical review track for [CMPAAAAAAAA-55](/CMPAAAAAAAA/issues/CMPAAAAAAAA-55).
- Turn the parent initiative [CMPAAAAAAAA-15](/CMPAAAAAAAA/issues/CMPAAAAAAAA-15) into an implementation-ready MVP choice.
- Anchor the recommendation to the current repository baseline:
  - TypeScript modular monolith
  - `apps/admin` for internal operator UI
  - `apps/api` for API and job entry
  - `packages/domain`, `packages/db`, `packages/jobs` for the domain spine

## Decision Summary

- Recommended MVP: internal staffing operations control tower for Korean dispatch, subcontracting, and recurring outsourcing operators.
- Keep site-lead mobile workflows inside the same MVP as a thin task surface, not a separate product.
- Keep billing automation and compliance control as follow-on modules on the same data spine.
- Do not use GitHub as the runtime system of record for operations data. Use GitHub for engineering execution, release evidence, and automation.

## Candidate Comparison

| Candidate | Primary users | Core workflow | Canonical data model | External integrations | Main technical risk | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Internal Operations Control Tower | Operations coordinator, dispatch lead, finance admin, site lead | Order intake -> worker qualification -> placement -> attendance approval -> invoice handoff | `ClientAccount`, `Site`, `Order`, `Worker`, `Assignment`, `Attendance`, `Invoice`, `ComplianceArtifact`, `AuditEvent` | object storage for evidence, CSV or spreadsheet export, notification adapter, internal outbox jobs | Scope can sprawl if too many adjacent workflows are added before the first pilot loop is proven | Choose now |
| Timesheet-to-Invoice Automation | Finance admin, senior operator | Attendance import -> approval reconciliation -> invoice draft -> export handoff | `ClientAccount`, `Site`, `Worker`, `AttendanceImportBatch`, `Attendance`, `InvoiceDraft`, `BillingAdjustment`, `AuditEvent` | spreadsheet import and export, accounting or ERP export, email delivery | Upstream order and placement truth remains fragmented, so billing correctness depends on data cleanup outside the product | Defer as module 2 |
| Compliance and Contract Control | Operations admin, compliance reviewer | onboarding document intake -> verification -> expiry reminder -> pre-placement gate | `Worker`, `ClientAccount`, `Contract`, `ComplianceArtifact`, `VerificationTask`, `AuditEvent` | object storage, e-sign provider, OCR or file-processing job, notification adapter | Important for legal safety, but does not own the daily operating loop that creates repeated usage | Defer as module 3 |

## Candidate Details

### 1. Internal Operations Control Tower

- Users:
  - operations coordinator
  - operations manager
  - finance admin
  - site lead on mobile
- Core pain:
  - order intake, staffing, attendance, and billing handoff are split across spreadsheets, chat, phone, and ad hoc documents
  - same-day replacement and attendance exceptions are hard to trace back into billing impact
- Core workflow:
  - capture client demand
  - release order into staffing queue
  - validate worker readiness
  - commit placement with rate and schedule snapshots
  - capture and approve attendance
  - hand off approved rows into billing-ready export
- Data model:
  - reuse the current repository domain spine in `packages/domain`
  - preserve assignment snapshot immutability so billing history does not drift after upstream edits
  - keep audit events append-only for approval, override, correction, and export actions
- External integrations:
  - S3-compatible object storage for contracts, evidence, and exports
  - spreadsheet-first CSV export for billing handoff
  - notification adapter for staffing confirmations, attendance reminders, and exception escalation
  - optional downstream ERP or accounting connector after the first pilot
- Why it is strong:
  - matches the existing architecture and documents already in this repository
  - creates the canonical entities required for every follow-on module
  - captures the operator pain that repeats daily and creates budget urgency

### 2. Timesheet-to-Invoice Automation

- Users:
  - finance admin
  - branch operations manager
- Core pain:
  - month-close still requires attendance cleanup, manual reconciliation, and invoice prep
- Core workflow:
  - import attendance
  - resolve approval blockers
  - generate draft billing rows
  - export invoice-ready package
- Data model:
  - smaller than candidate 1
  - still needs attendance lineage, approval status, adjustment reasons, and audit
  - depends on imported upstream references instead of owning placement truth
- External integrations:
  - spreadsheet import
  - accounting or ERP export
  - email or file delivery to finance or clients
- Why it is weaker as the first wedge:
  - easier to build, but it sits downstream from the messy part of the operation
  - weakens defensibility because upstream spreadsheets remain the real source of truth
  - billing gains are real, but it does not naturally open the placement and attendance control surface

### 3. Compliance and Contract Control

- Users:
  - operations admin
  - compliance reviewer
  - branch manager
- Core pain:
  - missing or expired worker and client documents block placement and create legal risk
- Core workflow:
  - collect artifacts
  - verify completeness and expiry
  - block or allow placement
  - trigger reminders and revision capture
- Data model:
  - `Contract`
  - `ComplianceArtifact`
  - revision metadata
  - verification tasks
  - audit trail
- External integrations:
  - object storage
  - file parsing
  - e-sign
  - notification reminders
- Why it is weaker as the first wedge:
  - high-value support module, but not the daily operating control tower
  - usage frequency and urgency are lower than order, placement, and attendance loops
  - best shipped on top of candidate 1 because placement gating needs shared canonical records

## Selected MVP

### Chosen product

- Internal staffing operations control tower.

### Why now

- It owns the real operating loop:
  - demand intake
  - staffing and placement
  - attendance approval
  - invoice handoff
- It creates the system-of-record spine already reflected in the repository domain model and architecture docs.
- It lets the company validate one end-to-end Korean outsourcing workflow before expanding into worker apps, payroll, ERP, or generic workflow tooling.

### Scope rule

- Include site-lead mobile workflows only as thin, task-first surfaces:
  - today roster
  - attendance capture
  - exception submission
  - evidence upload
- Do not launch a separate worker app or client portal in the first cut.

## GitHub Operating Model

### Core rule

- Paperclip stays the source of truth for goals, ownership, issue status, approvals, and delegation.
- GitHub stays the source of truth for code, branches, pull requests, CI, release tags, and reviewable artifacts.
- The product runtime system of record must be Postgres, not GitHub Issues.

### Recommended flow

1. CEO, CTO, PM, or operations stakeholders create or refine the work item in Paperclip.
2. CTO decomposes implementation-ready child issues with one owner and explicit acceptance criteria.
3. The assignee checks out the Paperclip issue and creates a Git branch using the issue identifier.
4. The assignee opens a PR with:
   - linked Paperclip issue
   - change summary
   - risk notes
   - verification notes
5. CI runs:
   - lint
   - typecheck
   - tests
   - build
   - demo or evidence bundle when required
6. QA enters only for workflow-critical slices such as placement, attendance, billing, compliance, and audit trails.
7. After merge and required verification, the Paperclip issue is closed.

### Product-side GitHub linkage

- In v1, do not mirror every operational event into GitHub.
- Only create GitHub artifacts for engineering work:
  - feature branches
  - pull requests
  - CI runs
  - release notes
  - reviewable demo bundles
- If the company wants request intake tied to GitHub, add it in phase 2 as automation:
  - Paperclip issue creates linked branch or PR metadata automatically
  - PR state posts back into the Paperclip issue
  - CI failures or merge completion post back into the same Paperclip thread

## Four-Week Build Sequence

### Week 1

- lock schema and status vocabulary for:
  - `Order`
  - `Assignment`
  - `Attendance`
  - `Invoice`
- implement Postgres schema skeleton and migration baseline
- stand up JSON API boundaries for order intake, placement commit, attendance approval, and billing handoff request
- harden GitHub governance:
  - branch naming
  - PR template
  - CI baseline

### Week 2

- build operator admin shell for:
  - work queue
  - order intake
  - worker readiness
  - placement board
- wire domain-safe placement logic and assignment snapshots to persistence
- seed realistic demo data for one recurring outsourcing client and site

### Week 3

- ship site-lead mobile surfaces for:
  - roster
  - check-in or check-out
  - no-show or exception capture
  - evidence upload
- ship attendance approval queue and correction audit trail
- verify same-day replacement and exception traceability

### Week 4

- ship billing handoff workspace with spreadsheet-first export
- add outbox jobs for reminders, export generation, and retry-safe side effects
- run one thin-slice pilot proof:
  - order -> placement -> attendance -> billing handoff
- close the loop with QA release gate evidence and demo bundle refresh

## Immediate Engineering Delegation

- Backend Engineer:
  - persistent ops core for order -> placement -> attendance -> billing handoff
- Frontend Engineer:
  - operator work queue, placement board, attendance review, and billing review shell
- Automation Engineer:
  - Paperclip-to-GitHub branch or PR discipline, CI baseline, evidence automation
- QA Reviewer:
  - thin-slice acceptance matrix and release gate for placement, attendance, billing, and audit-sensitive changes

## Main Risks and Blockers

- The first design-partner workflow details are still partially hypothesis-driven.
- Client-specific billing export format is still unknown and should default to spreadsheet-first.
- The first MVP must resist pressure to expand into:
  - worker self-service
  - payroll engine
  - ERP replacement
  - broad compliance platform
- Public GitHub posture remains acceptable only if secrets, raw pilot data, and internal-only evidence stay out of Git.

## Final Recommendation

- Build candidate 1 now.
- Treat candidate 2 and candidate 3 as modules on the same canonical data spine.
- Use GitHub only for engineering execution and evidence, never as the operational runtime database.
- Keep the first four weeks focused on one reviewable thin slice that proves order -> placement -> attendance -> billing handoff inside one operator system.

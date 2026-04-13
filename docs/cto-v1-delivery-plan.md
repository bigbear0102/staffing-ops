# CTO V1 Delivery Plan

## Decision Summary

- Product wedge: internal staffing operations control tower with a system-of-record spine.
- First owned workflow: client order intake -> worker qualification -> placement -> attendance approval -> invoice handoff.
- Target market: Korean dispatch, subcontract, and outsourcing operators running recurring multi-site operations.
- Primary persona: operations coordinator. Supporting personas: operations manager, finance admin, and site lead.
- Product stance: do not start as a generic attendance SaaS, payroll engine, or broad ERP replacement.

## Why This Wins

- The highest recurring pain sits between demand intake and finance handoff, not inside one narrow back-office step.
- This wedge creates the canonical entities that all follow-on products reuse: `ClientAccount`, `Site`, `Order`, `Worker`, `Assignment`, `Attendance`, `Invoice`, `ComplianceArtifact`.
- The chosen architecture already fits this cut: TypeScript modular monolith, Postgres, background jobs, object storage, and audit log.
- It gives the company one end-to-end operator workflow to validate before expanding into payroll, compliance depth, client portals, or worker self-service.

## Top 3 Product Options

### 1. Internal Operations OS
- Users: operations coordinators, dispatch leads, branch managers, finance handoff staff.
- Core pain: order, placement, attendance, and billing handoff are fragmented across spreadsheets, chat, phone, and ad hoc documents.
- Core value: one operating loop, one event trail, one source of truth for exceptions and approvals.
- Delivery view: broadest scope, but best long-term leverage.

### 2. Timesheet-to-Invoice Automation
- Users: finance admins and senior operators.
- Core pain: approved attendance still requires manual reconciliation and billing prep.
- Core value: faster period close and fewer invoice errors.
- Delivery view: easier to ship, but it inherits messy upstream placement workflows and weakens data leverage.

### 3. Compliance and Contract Control
- Users: operations admins and compliance reviewers.
- Core pain: document expiry, version confusion, and missing evidence create legal and service risk.
- Core value: stronger auditability and pre-assignment gating.
- Delivery view: useful support module, but not the best first wedge because it does not own the daily operating loop.

## Scope Freeze

### P0 included
- order intake
- worker qualification and document checks
- placement board and slot status tracking
- attendance approval and exception queue
- invoice handoff queue
- audit trail for critical changes
- mobile-first site-lead roster, attendance, exception, and evidence capture

### Explicitly excluded from v1
- worker self-service app
- AI auto-matching as a headline feature
- payroll engine and tax engine
- deep ERP integrations
- client portal full build
- generic workflow engine or microservices split

## Product and Architecture Stance

- Build a control tower that still owns the core operational records.
- Do not ship a pure analytics overlay that depends on permanently messy source systems.
- Do not attempt a full staffing platform on day one.
- Default the v1 finance handoff target to spreadsheet-first export, not ERP connector-first integration.
- Keep state transitions explicit and domain-specific:
  - `Order`
  - `Assignment`
  - `Attendance`
  - `Invoice`
- Snapshot assignment rates and schedule inputs so invoice generation remains stable after upstream edits.
- Treat exception handling and auditability as core product behavior, not admin afterthoughts.

## Delivery Sequence

### Now
- Lock the product decision and execution sequence in this document.
- Keep GitHub repo baseline work on [CMPAAAAAAAA-32] unblocked once the GitHub account decision is made.
- Move backend foundation issue [CMPAAAAAAAA-34] into active engineering queue.

### First 30 days
- backend foundation, schema skeleton, and domain module boundaries
- operator admin shell and P0 screen skeleton
- shared state vocabulary across backend and frontend
- QA release gate and UAT matrix for the first thin slice

### First 60 days
- process at least 5 live client orders end to end
- cover at least 20 worker assignments
- support at least 150 approved shifts in-system
- generate invoice handoff without spreadsheet re-entry for at least 80 percent of completed pilot shifts
- preserve reviewable audit evidence for placement overrides, attendance corrections, and finance handoff decisions

## Implementation Workstreams

### Backend
- establish modular monolith foundation and domain skeleton
- implement `Order`, `Assignment`, `Attendance`, and audit-driven transition boundaries
- add idempotent jobs and outbox skeleton for invoice handoff and reminders

### Frontend
- implement operator shell for `Work Queue`, `Demand`, `Placement`, `Attendance`, and `Billing`
- build P0 screen flows around the single operating loop
- keep site-lead mobile surfaces thin and task-first

### Automation
- maintain Paperclip -> branch -> PR -> CI discipline
- protect `main` using the GitHub path the company actually approves
- if the company stays on GitHub Free, treat `public repo + no sensitive material in Git` as the default governance path
- keep PR evidence and status sync lightweight in phase 1

### QA
- convert acceptance criteria into explicit UAT scenarios
- verify role boundaries, audit trail integrity, and mobile failure recovery
- gate workflow-critical merges before pilot rollout

## Critical Risks

- GitHub branch protection is blocked on repository plan or ownership configuration.
- The first design partner's downstream billing export format is still unknown.
- Sample operational data and month-close workflow need to be collected early, or the thin slice will optimize for the wrong exception patterns.
- The product must stay disciplined around the core loop; widening into worker app, payroll, or ERP before pilot proof will slow delivery.

## CEO Decisions Required

- If the company will not pay for GitHub, approve `public repo + free mode` and keep secrets, raw pilot data, and internal-only evidence out of Git.
- If the company refuses both paid GitHub and a public repo, accept that branch governance remains blocked and [CMPAAAAAAAA-32](/CMPAAAAAAAA/issues/CMPAAAAAAAA-32) will stay open.
- Confirm whether the first pilot target should optimize for:
  - deeper system-of-record adoption
  - faster overlay-style reporting deployment
- Confirm first design-partner access path so sample data, approval SLA, and month-close workflow can be collected quickly.

## Working Rule

- Paperclip remains the source of truth for issue ownership, status, approvals, and delegation.
- GitHub remains the source of truth for code, PRs, CI, and merge history.
- Every code-changing execution issue should map to one branch and one PR.

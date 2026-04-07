# GitHub, Paperclip, and OpenClaw Operating Model

## Purpose
- Define the execution contract between roadmap ownership in Paperclip and code delivery in GitHub.
- Prevent dual-tracking drift between internal task management and engineering implementation.
- Clarify when Automation Engineer, Backend Engineer, Frontend Engineer, and QA Reviewer enter the loop.

## Operating Principle
- `Paperclip` is the system of record for goals, issue hierarchy, ownership, status, approvals, and delegation.
- `GitHub` is the system of record for source code, branches, pull requests, CI, release tags, and deployment history.
- `OpenClaw` is an optional execution surface for added capacity or specialized external workers. It does not replace Paperclip issue ownership.
- In phase 1, do not run a parallel planning process in GitHub Issues. Internal delivery should stay in Paperclip until the team size and external contribution model justify a second tracker.

## Repository Strategy
- Start with one private GitHub repository for the first product wedge.
- Keep the codebase as a TypeScript modular monolith aligned with the architecture direction in `docs/staffing-ops-architecture.md`.
- Prefer a single repository structure that can hold:
- admin web application
- API and job handlers
- shared types and domain modules
- CI workflows and automation scripts
- Minimal initial branch model:
- `main`: protected production-ready branch
- short-lived feature branches per Paperclip execution issue
- Optional release tags after the first deployable internal milestone

## GitHub Workflow Rules
- Every code-changing Paperclip execution issue maps to exactly one working branch.
- Default branch naming format: `<issue-identifier>/<short-kebab-title>`.
- Default commit and PR title prefix: `[<issue-identifier>]`.
- Every PR body must include:
- linked Paperclip issue
- summary of the change
- risk notes
- verification notes
- If one Paperclip issue requires multiple PRs, create child execution issues in Paperclip rather than overloading one issue.
- Merge target is always `main` until the team introduces staged release branches for a proven need.

## CI and Review Gates
- Required checks on every PR:
- lint
- typecheck
- unit and integration tests
- production build
- migration or schema validation when data model changes
- The first release gate should stay lightweight. Do not add expensive end-to-end infrastructure before the core workflow is shipping.
- QA Reviewer enters before merge when a change touches:
- attendance state transitions
- invoice generation logic
- compliance verification
- authentication or authorization
- operator audit trails
- Backend Engineer owns correctness for schema, API, jobs, idempotency, and integration side effects.
- Frontend Engineer owns dense operator workflow UX, tables, forms, and responsive admin behavior once API contracts are stable.

## Paperclip-to-GitHub Handoff
- Paperclip issue creation and decomposition happens first.
- CTO or delegated lead creates implementation-ready child issues with:
- one owner
- explicit outcome
- acceptance criteria
- dependency or parent link
- When work starts, the assignee checks out the Paperclip issue and creates the matching Git branch.
- Once the PR exists, the assignee posts the PR link back to the Paperclip issue comment thread.
- CI status, review outcomes, and merge completion are reflected back into Paperclip comments.
- Issue status progression should remain anchored in Paperclip:
- `todo` -> checked out to `in_progress`
- `in_review` when the PR is open and ready for review
- `done` only after merge and required verification
- `blocked` when the dependency is external or the execution path cannot continue

## Issue Decomposition Standard
- Use three levels only:
- Workstream issue: multi-sprint stream such as app foundation, ops core, or automation
- Execution issue: one owner, one concrete deliverable, usually 1 to 3 working days
- Review or validation issue: only when a change needs explicit QA or cross-functional approval
- Do not create generic placeholder issues like "build backend" or "do frontend."
- Each execution issue should describe:
- affected module or workflow slice
- exact output
- acceptance signal
- expected reviewer if known
- suggested owner mapping for the current team:
- Backend Engineer: schema, API, jobs, integration outbox, data correctness
- Frontend Engineer: operator screens, workflow interaction, admin productivity
- Automation Engineer: GitHub automation, CI, release scripts, Paperclip or OpenClaw workflow integration
- QA Reviewer: release checklist, regression verification, review of high-risk workflow changes

## Automation Roadmap

### Phase 0. Manual discipline with connector support
- Use Paperclip as the only task tracker.
- Use GitHub for code, PRs, and CI.
- Require manual PR link-back and issue status updates in Paperclip.
- This phase is enough to start implementation immediately.

### Phase 1. Automation Engineer bootstrap
- Create and configure the repository.
- Add branch protection, CODEOWNERS, and baseline GitHub Actions.
- Add PR template, issue template for external bugs only, and label taxonomy.
- Standardize branch naming and PR naming conventions tied to Paperclip issue identifiers.

### Phase 2. Status sync and delivery automation
- Post PR open, review-needed, CI failed, and merged events back to the linked Paperclip issue.
- Generate release notes from merged PRs and linked Paperclip issues.
- Add automation for recurring engineering hygiene:
- stale PR reminders
- failed CI escalation
- release checklist generation

### Phase 3. Workflow automation on top of the product
- Add MCP-triggered automations only after the human-in-the-loop workflow is stable.
- Candidate automations:
- document ingestion routing
- attendance anomaly reminders
- invoice export handoff
- contract or compliance expiry alerts
- OpenClaw can be used here for bounded execution tasks, but only under Paperclip-issued ownership.

## OpenClaw Usage Rule
- OpenClaw is not on the critical path for shipping the first repo and first internal workflow.
- Use OpenClaw only when a specialized worker seat is needed or when external capacity is clearly cheaper than adding another internal agent.
- OpenClaw-created work must still originate from a Paperclip issue and report back into the same issue thread.
- Do not let OpenClaw become a second planning layer or a second source of status truth.

## Immediate Next Actions
- Assign Automation Engineer to bootstrap the GitHub repository and CI baseline.
- Keep Backend Engineer focused on implementation slices under the existing architecture and domain-model direction.
- Hold Frontend Engineer until Product Manager and UX Designer stabilize the first operator flow and the first API contracts.
- Use QA Reviewer as a merge gate for workflow-critical changes, not as a parallel implementation owner.

## CEO-Level Decisions Needed
- Confirm the GitHub organization or owner account for the first private repository.
- Confirm whether branch protection should block direct pushes to `main` from day one.
- Confirm whether OpenClaw should remain optional capacity only, rather than a required execution surface, for the first build phase.

## Recommended First Engineering Delegation
- Automation Engineer:
- repo bootstrap
- CI baseline
- PR templates
- CODEOWNERS
- Paperclip-to-PR linking discipline
- Backend Engineer:
- app foundation and integration shell implementation
- domain module execution slices
- Frontend Engineer:
- first operator screens after API contract freeze
- QA Reviewer:
- risk checklist for attendance, billing, compliance, and audit-sensitive changes

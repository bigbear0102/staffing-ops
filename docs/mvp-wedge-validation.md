# MVP Wedge Validation

## Recommendation
- Keep the first wedge as an internal operations OS for Korean dispatch, staffing, and outsourcing teams.
- First owned workflow: client order intake -> worker qualification and matching -> placement tracking -> attendance approval -> invoice handoff.
- This remains the strongest first build because it creates the canonical data model and lets one small team ship an end-to-end operating loop without external user surfaces.

## Why This Wedge Wins
- It touches the highest-friction operator workflow instead of a narrow back-office substep.
- The domain entities already defined in the architecture cut map directly to this workflow: `ClientAccount`, `Site`, `Order`, `Worker`, `Assignment`, `Attendance`, `Invoice`, `ComplianceArtifact`.
- It creates reusable foundations for later automation, MCP actions, reporting, and partner integrations.
- It fits the chosen architecture. A TypeScript modular monolith with Postgres, jobs, file storage, and audit logging is enough to ship this wedge without premature platform work.
- It matches the first engineering hire profile. The company needs a senior full-stack builder who can model workflows and ship integrated slices, not a specialist in scale infrastructure or research ML.

## Closest Plausible Alternative
- Alternative wedge: timesheet-to-invoice back-office automation only.
- Why it is plausible:
- It is narrower and easier to message.
- It could produce measurable finance value quickly.
- Why it should not win:
- It starts too late in the workflow and inherits messy upstream spreadsheets, calls, and chat-based placement operations.
- It weakens the leverage of the first data model because `Order`, `Worker`, and `Assignment` stay informal.
- It biases the first hire toward accounting automation or ERP integration instead of product engineering across the full operator workflow.
- It does not create as strong a base for future compliance, alerts, or AI-assisted operator actions.

## 60-Day Success Metric
- The MVP should process at least 5 live client orders end-to-end inside the system.
- Those orders should cover at least 20 worker assignments.
- At least 80 percent of completed shifts in the pilot should move from approved attendance to invoice handoff without spreadsheet re-entry.

## Non-Goals For The First 60 Days
- No worker mobile app, worker self-service, or client portal.
- No generalized auto-matching engine or marketplace-style sourcing product.
- No payroll engine, tax engine, or ERP-grade finance platform.

## Implications For Product And Hiring
- The first internal users are operations coordinators and account managers, not external workers.
- The first engineer should be judged on workflow modeling, CRUD plus state transitions, operator UX, integration discipline, and maintainable delivery speed.
- If the company later pivots toward external self-serve surfaces or a finance-only wedge, the first engineering hire scorecard should be revisited.

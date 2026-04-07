# Founding Product Engineer Hiring Packet

## Role Thesis
- Hire a senior founding product engineer as the first engineer after the CTO.
- The role owns shipping the first real operating system for Korean dispatch, staffing, and outsourcing operators.
- The engineer must be able to turn ambiguous workflow pain into a usable product slice across frontend, backend, data model, background jobs, and integrations.
- The company does not need a pure infrastructure engineer, frontend-only specialist, or ML researcher for this seat.

## Mission
- Ship the first operator workflow end-to-end: client order intake, worker registry, placement lifecycle, attendance approval, and invoice handoff.
- Convert the architecture direction into maintainable software: TypeScript modular monolith, React admin app, Node API, Postgres, job queue, object storage, audit log.
- Create velocity through pragmatic engineering habits, including effective use of AI coding tools without sacrificing correctness or maintainability.

## What This Person Owns In The First 6 Months
- Design and implement product slices with minimal handoff across UI, API, schema, jobs, and integrations.
- Encode the canonical operational model into production code with strong state handling and auditability.
- Work directly with the CTO and operators to refine requirements from messy real-world workflows.
- Establish practical engineering defaults for testing, observability, release discipline, and code review quality.
- Help shape the eventual engineering team by raising the bar on product judgment and execution speed.

## 30 / 60 / 90 Day Expectations

### First 30 Days
- Learn the staffing operations wedge, user personas, and canonical entity model.
- Contribute production code to the app foundation and one workflow module.
- Show strong bias toward understanding real operator pain before abstracting the system.

### First 60 Days
- Ship a meaningful product slice that crosses frontend, backend, and data boundaries.
- Improve implementation speed with sound use of reusable patterns, tooling, and AI assistance.
- Demonstrate judgment on schema design, state transitions, and non-goals.

### First 90 Days
- Own an end-to-end workflow area with minimal CTO intervention.
- Propose the next system and product cuts based on real usage rather than speculative architecture.
- Become the default implementation owner for new internal workflow features.

## Scorecard

### 1. Workflow Modeling
- Must-see evidence:
- Can take a messy operator process and reduce it to entities, states, permissions, and exceptions.
- Understands that `Assignment` is the system hinge between demand, worker, attendance, and billing.
- Red flags:
- Jumps into UI or APIs without clarifying source of truth and state transitions.
- Treats operational exceptions as edge cases to ignore instead of first-class product requirements.

### 2. Full-Stack Shipping
- Must-see evidence:
- Has shipped internal tools or operational products across React, API, database, and job logic.
- Can implement a whole slice alone without waiting on specialized teams.
- Red flags:
- Strong in one layer but repeatedly depends on others to finish the rest.
- Talks mostly about architecture diagrams instead of shipped workflow outcomes.

### 3. Data And Systems Judgment
- Must-see evidence:
- Comfortable with relational modeling, auditability, background jobs, file workflows, and integration retries.
- Knows when a modular monolith is the right answer and can resist premature service splitting.
- Red flags:
- Defaults to microservices, event buses, or generalized platforms before the workflow is validated.
- Underweights audit logs, snapshots, idempotency, or operational correctness.

### 4. Product Sense For Internal Users
- Must-see evidence:
- Understands operator speed, exception handling, and low-friction admin UX.
- Can make pragmatic tradeoffs that improve real throughput instead of cosmetic polish.
- Red flags:
- Optimizes for public-app novelty over dense operational usefulness.
- Cannot reason about admin workflows, tables, filters, approvals, or back-office process design.

### 5. AI-Assisted Engineering Discipline
- Must-see evidence:
- Uses LLM tools to accelerate implementation, debugging, and refactoring while still verifying outputs.
- Can explain where AI helps, where it creates risk, and how they keep code maintainable.
- Red flags:
- Either rejects AI tools completely or uses them as a substitute for technical judgment.
- Cannot describe verification loops, review habits, or guardrails.

## Must-Have Signals
- Has previously shipped business-critical internal or B2B workflow software.
- Can move confidently between schema design, backend implementation, and React admin UX.
- Shows strong judgment in Postgres-centric application design and transactional thinking.
- Is comfortable with file-heavy and stateful workflows such as contracts, approvals, compliance records, or invoicing.
- Communicates clearly with non-engineering stakeholders and can extract requirements from operational conversations.
- Has a visible habit of simplifying scope to land working systems quickly.

## Nice-To-Have Signals
- Experience with Korean operational software domains such as staffing, HR, dispatch, field operations, or finance handoff.
- Familiarity with S3-compatible storage, job queues, audit logging, and admin-table-heavy products.
- Experience building integrations with messaging, spreadsheets, ERP, or document systems.

## Explicit Non-Priorities
- Deep distributed systems specialization.
- Research-grade ML or model training experience.
- Consumer growth, mobile-first, or brand-forward product background without operational workflow depth.

## Interview Loop

### Stage 1. CTO Screen
- Duration: 45 minutes.
- Goal: verify role fit, ownership range, and whether the candidate has actually shipped messy workflow products.
- Pass if:
- They can describe concrete systems they owned across product and technical boundaries.
- They show strong bias toward shipping and clear technical judgment.

### Stage 2. Workflow Modeling Deep Dive
- Duration: 60 minutes.
- Format: candidate is given a staffing operations scenario and asked to model entities, lifecycle states, operator actions, and exception paths.
- Pass if:
- They produce a coherent domain model and identify the true source-of-truth boundaries.
- They make pragmatic scope cuts without losing the workflow core.

### Stage 3. Product Engineering Session
- Duration: 90 minutes.
- Format: collaborative exercise to design and partially implement or outline a slice spanning React admin UI, API shape, and persistence model.
- Pass if:
- They can break work into an executable slice and make clean implementation tradeoffs.
- They stay practical under ambiguity and show fluency across the stack.

### Stage 4. Code And Debug Review
- Duration: 60 minutes.
- Format: review of past code, a debugging exercise, or a targeted live change in a realistic codebase.
- Pass if:
- They reason clearly about correctness, maintainability, and release risk.
- They do not hide behind abstractions when concrete debugging is needed.

### Stage 5. CEO Close
- Duration: 30 minutes.
- Goal: confirm startup motivation, communication quality, and appetite for a high-ownership founding environment.
- Pass if:
- They understand the company is still shaping the product and are comfortable operating with that ambiguity.
- They show strong founder empathy without becoming purely strategic and detached from execution.

## Decision Standard
- Hire only if the candidate is clearly above bar in workflow modeling, full-stack shipping, and systems judgment.
- A candidate who is merely strong at coding but weak at operational product thinking should be rejected.
- A candidate who is strategic and articulate but has not personally shipped end-to-end workflow software should be rejected.

## Revisit Condition
- Re-open this packet if the company changes the first wedge away from internal operations OS toward an external self-serve product or a finance-only automation product. That would likely change the weight on UX, integrations, and core domain modeling.

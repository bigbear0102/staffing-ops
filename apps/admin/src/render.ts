import {
  assignmentStatusDescriptors,
  attendanceStatusDescriptors,
  billingStatusDescriptors,
  formatCurrencyKrw,
  orderStatusDescriptors,
  readinessDescriptors,
  type AuditTrailEntry
} from "@staffing-ops/domain";

import {
  createAdminDemoShell,
  getDescriptorTone,
  type AdminShellState,
  type CreateAdminShellOptions
} from "./shell.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderPill(label: string, tone: string, detail?: string): string {
  const title = detail ? ` title="${escapeHtml(detail)}"` : "";
  return `<span class="pill pill-${tone}"${title}>${escapeHtml(label)}</span>`;
}

function renderList(items: readonly string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderAuditDeltaTable(deltas: AuditTrailEntry["deltas"]): string {
  return `
    <table class="delta-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Before</th>
          <th>After</th>
        </tr>
      </thead>
      <tbody>
        ${deltas
          .map(
            (delta) => `
              <tr>
                <td>${escapeHtml(delta.label)}</td>
                <td>${escapeHtml(delta.before)}</td>
                <td>${escapeHtml(delta.after)}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderAuditTimeline(entries: readonly AuditTrailEntry[]): string {
  return `
    <div class="timeline">
      ${entries
        .map(
          (entry) => `
            <article class="timeline-entry">
              <div class="candidate-head">
                <strong>${escapeHtml(entry.title)}</strong>
                ${renderPill(entry.occurredAt, entry.tone)}
              </div>
              <p>${escapeHtml(entry.summary)}</p>
              ${renderList([
                `Actor: ${entry.actorName}`,
                `Role: ${entry.actorRole}`,
                `Reason: ${entry.reason ?? "No typed reason"}`,
                `Source trace: ${entry.sourceTrace.join(" -> ")}`
              ])}
              ${renderAuditDeltaTable(entry.deltas)}
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderWorkQueue(shell: AdminShellState): string {
  const screen = shell.screens.workQueue;

  return `
    <section class="hero">
      <div>
        <p class="eyebrow">${escapeHtml(shell.header.eyebrow)}</p>
        <h1>${escapeHtml(screen.title)}</h1>
        <p class="lede">${escapeHtml(screen.subtitle)}</p>
      </div>
      <div class="hero-actions">
        ${shell.header.quickActions.map((action) => `<button>${escapeHtml(action)}</button>`).join("")}
      </div>
    </section>
    <section class="metric-grid">
      ${screen.summaryCards
        .map(
          (card) => `
            <article class="metric-card metric-${card.tone}">
              <span class="metric-label">${escapeHtml(card.label)}</span>
              <strong>${String(card.value)}</strong>
              <p>${escapeHtml(card.detail)}</p>
            </article>
          `
        )
        .join("")}
    </section>
    <section class="two-column">
      <div class="stack">
        ${screen.groups
          .map(
            (group) => `
              <article class="panel">
                <header class="panel-header">
                  <h2>${escapeHtml(group.label)}</h2>
                  <span>${String(group.items.length)} items</span>
                </header>
                <table>
                  <thead>
                    <tr>
                      <th>Case</th>
                      <th>Owner</th>
                      <th>Urgency</th>
                      <th>Blocker</th>
                      <th>Next action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${group.items
                      .map(
                        (item) => `
                          <tr>
                            <td>
                              <strong>${escapeHtml(item.title)}</strong>
                              <div class="muted">${escapeHtml(item.subtitle)}</div>
                            </td>
                            <td>${escapeHtml(item.owner)}</td>
                            <td>${escapeHtml(item.urgency)}</td>
                            <td>${escapeHtml(item.blocker)}</td>
                            <td>${renderPill(item.nextAction, "accent")}</td>
                          </tr>
                        `
                      )
                      .join("")}
                  </tbody>
                </table>
              </article>
            `
          )
          .join("")}
      </div>
      <aside class="stack">
        <article class="panel">
          <header class="panel-header">
            <h2>Alerts rail</h2>
            <span>Escalate before cutoff</span>
          </header>
          <div class="alert-list">
            ${screen.alerts
              .map(
                (alert) => `
                  <article class="alert alert-${alert.tone}">
                    <strong>${escapeHtml(alert.title)}</strong>
                    <p>${escapeHtml(alert.detail)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </article>
      </aside>
    </section>
  `;
}

function renderDemand(shell: AdminShellState): string {
  const screen = shell.screens.demand;
  const selectedStatus = orderStatusDescriptors[screen.selectedOrder.status];
  const editorStatus = orderStatusDescriptors[screen.editorOrder.status];

  return `
    <section class="hero compact">
      <div>
        <p class="eyebrow">Demand</p>
        <h1>${escapeHtml(screen.title)}</h1>
        <p class="lede">${escapeHtml(screen.subtitle)}</p>
      </div>
      <div class="hero-meta">
        ${renderPill(selectedStatus.label, getDescriptorTone(selectedStatus.tone), selectedStatus.detail)}
        ${renderPill(editorStatus.label, getDescriptorTone(editorStatus.tone), editorStatus.detail)}
      </div>
    </section>
    <section class="three-column">
      <article class="panel">
        <header class="panel-header">
          <h2>Clients & sites</h2>
          <span>Saved context</span>
        </header>
        ${screen.navigator
          .map(
            (node) => `
              <div class="tree-node">
                <strong>${escapeHtml(node.clientName)}</strong>
                <ul>
                  ${node.sites
                    .map(
                      (site) =>
                        `<li>${escapeHtml(site.siteName)} <span class="muted">${String(site.openOrders)} open</span></li>`
                    )
                    .join("")}
                </ul>
              </div>
            `
          )
          .join("")}
      </article>
      <article class="panel">
        <header class="panel-header">
          <h2>Orders</h2>
          <span>Queue-first inventory</span>
        </header>
        <table>
          <thead>
            <tr>
              <th>Client / site</th>
              <th>Role</th>
              <th>Status</th>
              <th>Fill</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            ${screen.orders
              .map((order) => {
                const descriptor = orderStatusDescriptors[order.status];
                const fill = `${String(order.filledHeadcount)}/${String(order.headcount)}`;
                return `
                  <tr>
                    <td>
                      <strong>${escapeHtml(order.clientName)}</strong>
                      <div class="muted">${escapeHtml(order.siteName)}</div>
                    </td>
                    <td>${escapeHtml(order.role)}</td>
                    <td>${renderPill(descriptor.label, getDescriptorTone(descriptor.tone), descriptor.detail)}</td>
                    <td>${escapeHtml(fill)}</td>
                    <td>${escapeHtml(order.riskLevel)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </article>
      <div class="stack">
        <article class="panel">
          <header class="panel-header">
            <h2>Selected order detail</h2>
            <span>Next action first</span>
          </header>
          <div class="summary-grid">
            <div><span>Role</span><strong>${escapeHtml(screen.selectedOrder.role)}</strong></div>
            <div><span>Date range</span><strong>${escapeHtml(screen.selectedOrder.dateRange)}</strong></div>
            <div><span>Shift pattern</span><strong>${escapeHtml(screen.selectedOrder.shiftPattern)}</strong></div>
            <div><span>Fill state</span><strong>${String(screen.selectedOrder.filledHeadcount)}/${String(screen.selectedOrder.headcount)}</strong></div>
          </div>
          ${renderList([
            `Primary action: ${screen.selectedOrder.nextAction}`,
            `Source evidence: ${screen.selectedOrder.evidenceLinkLabel}`,
            `Attendance route: ${screen.selectedOrder.attendanceApprovalMethod}`,
            `Bill rate: ${formatCurrencyKrw(screen.selectedOrder.billRateKrw)}`
          ])}
        </article>
        <article class="panel">
          <header class="panel-header">
            <h2>Order intake editor</h2>
            <span>
              ${renderPill(
                screen.editorPrimaryAction,
                screen.editorIsPublishReady ? "success" : "warning"
              )}
            </span>
          </header>
          ${
            screen.editorBlockers.length > 0
              ? `
                <article class="subpanel">
                  <div class="subpanel-header">
                    <strong>Publish blockers</strong>
                    ${renderPill("Blocked", "warning")}
                  </div>
                  ${renderList(screen.editorBlockers)}
                </article>
              `
              : `
                <article class="subpanel">
                  <div class="subpanel-header">
                    <strong>Release state</strong>
                    ${renderPill("Publish ready", "success")}
                  </div>
                  ${renderList([
                    "Commercial terms are explicit.",
                    "The order can move straight into Needs staffing."
                  ])}
                </article>
              `
          }
          ${screen.intakeSections
            .map(
              (section) => `
                <article class="subpanel">
                  <div class="subpanel-header">
                    <strong>${escapeHtml(section.title)}</strong>
                    ${renderPill(section.state, section.state === "Blocked" ? "warning" : "success")}
                  </div>
                  ${renderList(section.bullets)}
                </article>
              `
            )
            .join("")}
        </article>
      </div>
    </section>
  `;
}

function renderPlacement(shell: AdminShellState): string {
  const screen = shell.screens.placement;
  const selectedReadiness = readinessDescriptors[screen.selectedCandidate.readinessBadge];
  const selectedStatus = assignmentStatusDescriptors[screen.selectedCandidate.assignmentStatus];
  const latestAuditEntry = screen.selectedCandidate.auditTrail[0];
  const correlatedAssignmentId =
    screen.lastCommittedAssignment?.orderId === screen.order.id
      ? screen.lastCommittedAssignment.assignmentId
      : `assignment-${screen.order.id}-${screen.selectedCandidate.id}`;

  return `
    <section class="hero compact">
      <div>
        <p class="eyebrow">Placement</p>
        <h1>${escapeHtml(screen.title)}</h1>
        <p class="lede">${escapeHtml(screen.subtitle)}</p>
      </div>
      <div class="hero-meta">
        ${renderPill(orderStatusDescriptors[screen.order.status].label, getDescriptorTone(orderStatusDescriptors[screen.order.status].tone))}
      </div>
    </section>
    <section class="three-column">
      <article class="panel">
        <header class="panel-header">
          <h2>Order requirement summary</h2>
          <span>${escapeHtml(screen.order.siteName)}</span>
        </header>
        ${renderList([
          `Role: ${screen.order.role}`,
          `Headcount gap: ${String(screen.openHeadcount)}`,
          `Schedule: ${screen.order.shiftPattern}`,
          `Night/overtime rule: ${screen.order.overtimeRule ?? "Pending confirmation"}`,
          `Attendance route: ${screen.order.attendanceApprovalMethod}`
        ])}
      </article>
      <article class="panel">
        <header class="panel-header">
          <h2>Ranked candidates</h2>
          <span>Fit + blocker context</span>
        </header>
        <div class="candidate-list">
          ${screen.candidates
            .map((candidate) => {
              const readiness = readinessDescriptors[candidate.readinessBadge];
              const status = assignmentStatusDescriptors[candidate.assignmentStatus];
              const selected = candidate.id === screen.selectedCandidate.id;

              return `
                <article class="candidate-card">
                  <div class="candidate-head">
                    <strong>${escapeHtml(candidate.workerName)}</strong>
                    <div class="pill-row">
                      ${selected ? renderPill("Selected", "accent") : ""}
                      ${renderPill(readiness.label, getDescriptorTone(readiness.tone), readiness.detail)}
                    </div>
                  </div>
                  <p>${escapeHtml(candidate.qualificationFit)} · ${escapeHtml(candidate.geography)}</p>
                  <p class="muted">${escapeHtml(candidate.recentAssignment)}</p>
                  <div class="pill-row">
                    ${renderPill(status.label, getDescriptorTone(status.tone), status.detail)}
                    ${renderPill(candidate.primaryAction, "accent")}
                  </div>
                  ${candidate.riskFlags.length > 0 ? renderList(candidate.riskFlags) : "<p class='muted'>No visible blockers.</p>"}
                </article>
              `;
            })
            .join("")}
        </div>
      </article>
      <div class="stack">
        <article class="panel">
          <header class="panel-header">
            <h2>Candidate detail</h2>
            <span>
              ${renderPill(
                screen.decisionState.blockerLabel,
                screen.decisionState.canCommit ? "success" : "warning"
              )}
            </span>
          </header>
          ${renderList([
            `Worker: ${screen.selectedCandidate.workerName}`,
            `Availability: ${screen.selectedCandidate.availability}`,
            `Status: ${selectedStatus.label}`,
            `Readiness: ${selectedReadiness.label}`,
            `Primary action: ${screen.selectedCandidate.primaryAction}`
          ])}
          ${renderList(screen.decisionState.blockerDetails)}
          ${
            latestAuditEntry
              ? `
                <article class="subpanel">
                  <div class="subpanel-header">
                    <strong>Review drawer</strong>
                    ${renderPill(latestAuditEntry.title, latestAuditEntry.tone)}
                  </div>
                  ${renderList([
                    `Actor: ${latestAuditEntry.actorName}`,
                    `Role: ${latestAuditEntry.actorRole}`,
                    `Occurred at: ${latestAuditEntry.occurredAt}`,
                    `Reason: ${latestAuditEntry.reason ?? "No typed reason"}`
                  ])}
                  ${renderAuditDeltaTable(latestAuditEntry.deltas)}
                </article>
              `
              : ""
          }
          <article class="subpanel">
            <div class="subpanel-header">
              <strong>Correlated proof IDs</strong>
              ${renderPill("Persisted join", "success")}
            </div>
            ${renderList([
              `Order ID: ${screen.order.id}`,
              `Candidate ID: ${screen.selectedCandidate.id}`,
              `${screen.lastCommittedAssignment ? "Assignment ID" : "Projected assignment ID"}: ${correlatedAssignmentId}`
            ])}
          </article>
        </article>
        <article class="panel">
          <header class="panel-header">
            <h2>Commit box</h2>
            <span>
              ${renderPill(
                screen.decisionState.actionLabel,
                screen.decisionState.canCommit ? "success" : "warning"
              )}
            </span>
          </header>
          ${renderList(screen.commitChecklist)}
          ${
            screen.lastCommittedAssignment
              ? `
                <article class="subpanel">
                  <div class="subpanel-header">
                    <strong>Latest assignment commit</strong>
                    ${renderPill(
                      screen.lastCommittedAssignment.mode === "override"
                        ? "Override path"
                        : "Standard path",
                      screen.lastCommittedAssignment.mode === "override" ? "warning" : "success"
                    )}
                  </div>
                  ${renderList([
                    `Worker: ${screen.lastCommittedAssignment.candidateName}`,
                    `Committed by: ${screen.lastCommittedAssignment.committedBy}`,
                    `Committed at: ${screen.lastCommittedAssignment.committedAt}`,
                    `Remaining headcount: ${String(screen.lastCommittedAssignment.remainingHeadcount)}`,
                    `Order status: ${screen.lastCommittedAssignment.orderStatusLabel}`,
                    `Override reason: ${screen.lastCommittedAssignment.overrideReason ?? "Not used"}`
                  ])}
                </article>
              `
              : ""
          }
        </article>
        <article class="panel">
          <header class="panel-header">
            <h2>Audit timeline</h2>
            <span>Override and commit evidence</span>
          </header>
          ${renderAuditTimeline(screen.selectedCandidate.auditTrail)}
        </article>
      </div>
    </section>
  `;
}

function renderAttendance(shell: AdminShellState): string {
  const screen = shell.screens.attendance;
  const selected = attendanceStatusDescriptors[screen.selectedRecord.status];
  const latestAuditEntry = screen.selectedRecord.auditTrail[0];
  const linkedDraft = screen.selectedRecord.linkedBillingDraftId
    ? shell.screens.billing.drafts.find(
        (draft) => draft.id === screen.selectedRecord.linkedBillingDraftId
      ) ?? null
    : null;

  return `
    <section class="hero compact">
      <div>
        <p class="eyebrow">Attendance</p>
        <h1>${escapeHtml(screen.title)}</h1>
        <p class="lede">${escapeHtml(screen.subtitle)}</p>
      </div>
      <div class="hero-actions">
        <button>${escapeHtml(screen.bulkActionLabel)}</button>
      </div>
    </section>
    <article class="panel filter-panel">
      <header class="panel-header">
        <h2>Sticky filters</h2>
        <span>Exception-first scope</span>
      </header>
      <div class="pill-row">
        ${screen.filters.map((filter) => renderPill(filter, "neutral")).join("")}
      </div>
    </article>
    <section class="two-column wide-right">
      <article class="panel">
        <header class="panel-header">
          <h2>Approval queue</h2>
          <span>Planned vs actual side by side</span>
        </header>
        <table>
          <thead>
            <tr>
              <th>Worker</th>
              <th>Scheduled</th>
              <th>Actual</th>
              <th>Status</th>
              <th>Exception</th>
              <th>Primary action</th>
            </tr>
          </thead>
          <tbody>
            ${screen.rows
              .map((record) => {
                const descriptor = attendanceStatusDescriptors[record.status];

                return `
                  <tr>
                    <td>
                      <strong>${escapeHtml(record.workerName)}</strong>
                      <div class="muted">${escapeHtml(record.assignmentLabel)}</div>
                    </td>
                    <td>${escapeHtml(record.scheduledWindow)}</td>
                    <td>${escapeHtml(record.actualWindow)}</td>
                    <td>${renderPill(descriptor.label, getDescriptorTone(descriptor.tone), descriptor.detail)}</td>
                    <td>${escapeHtml(record.exceptionCode ?? "Clean row")}</td>
                    <td>${renderPill(record.primaryAction, "accent")}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </article>
      <article class="panel">
        <header class="panel-header">
          <h2>Correction drawer</h2>
          <span>${renderPill(selected.label, getDescriptorTone(selected.tone), selected.detail)}</span>
        </header>
        ${renderList([
          `Worker: ${screen.selectedRecord.workerName}`,
          `Assignment ID: ${screen.selectedRecord.assignmentId}`,
          `Attendance ID: ${screen.selectedRecord.id}`,
          `Site: ${screen.selectedRecord.siteName}`,
          `Scheduled: ${screen.selectedRecord.scheduledWindow}`,
          `Actual: ${screen.selectedRecord.actualWindow}`,
          `Reason: ${screen.selectedRecord.reason ?? "No reason captured"}`,
          `Evidence: ${screen.selectedRecord.evidenceLinkLabel ?? "None"}`,
          `Linked billing draft: ${screen.selectedRecord.linkedBillingDraftId ?? "Not linked"}`
        ])}
        <article class="subpanel">
          <div class="subpanel-header">
            <strong>Correlated proof IDs</strong>
            ${renderPill("Review-ready", "success")}
          </div>
          ${renderList([
            `Assignment ID: ${screen.selectedRecord.assignmentId}`,
            `Attendance ID: ${screen.selectedRecord.id}`,
            `Billing draft ID: ${screen.selectedRecord.linkedBillingDraftId ?? "Not linked"}`,
            `Export batch ID: ${linkedDraft?.batch.id ?? "Pending batch"}`
          ])}
        </article>
        ${
          latestAuditEntry
            ? `
              <article class="subpanel">
                <div class="subpanel-header">
                  <strong>Review drawer</strong>
                  ${renderPill(latestAuditEntry.title, latestAuditEntry.tone)}
                </div>
                ${renderList([
                  `Actor: ${latestAuditEntry.actorName}`,
                  `Role: ${latestAuditEntry.actorRole}`,
                  `Occurred at: ${latestAuditEntry.occurredAt}`,
                  `Reason: ${latestAuditEntry.reason ?? "No typed reason"}`
                ])}
                ${renderAuditDeltaTable(latestAuditEntry.deltas)}
              </article>
            `
            : ""
        }
        <article class="subpanel">
          <div class="subpanel-header">
            <strong>Audit timeline</strong>
            ${renderPill("Reviewable proof", "success")}
          </div>
          ${renderAuditTimeline(screen.selectedRecord.auditTrail)}
        </article>
      </article>
    </section>
  `;
}

function renderBilling(shell: AdminShellState): string {
  const screen = shell.screens.billing;
  const selected = billingStatusDescriptors[screen.selectedDraft.status];
  const assignmentIds = [...new Set(screen.selectedDraft.lineItems.map((line) => line.sourceAssignmentId))];
  const attendanceIds = [...new Set(screen.selectedDraft.lineItems.map((line) => line.sourceAttendanceId))];

  return `
    <section class="hero compact">
      <div>
        <p class="eyebrow">Billing</p>
        <h1>${escapeHtml(screen.title)}</h1>
        <p class="lede">${escapeHtml(screen.subtitle)}</p>
      </div>
      <div class="hero-meta">${renderPill(screen.billingPeriod, "neutral")}</div>
    </section>
    <section class="two-column wide-right">
      <article class="panel">
        <header class="panel-header">
          <h2>Draft invoices</h2>
          <span>Readiness first</span>
        </header>
        <div class="draft-list">
          ${screen.drafts
            .map((draft) => {
              const descriptor = billingStatusDescriptors[draft.status];
              return `
                <article class="draft-card">
                  <div class="candidate-head">
                    <strong>${escapeHtml(draft.clientName)}</strong>
                    ${renderPill(descriptor.label, getDescriptorTone(descriptor.tone), descriptor.detail)}
                  </div>
                  <p>${escapeHtml(draft.siteName)} · ${escapeHtml(draft.billingPeriod)}</p>
                  <p class="muted">${escapeHtml(draft.primaryAction)}</p>
                  <strong>${escapeHtml(formatCurrencyKrw(draft.totalAmountKrw))}</strong>
                </article>
              `;
            })
            .join("")}
        </div>
      </article>
      <article class="panel">
        <header class="panel-header">
          <h2>Selected draft</h2>
          <span>${renderPill(selected.label, getDescriptorTone(selected.tone), selected.detail)}</span>
        </header>
        ${
          screen.selectedDraft.blockedBy.length > 0
            ? renderList(screen.selectedDraft.blockedBy)
            : "<p class='muted'>No blockers remain.</p>"
        }
        <article class="subpanel">
          <div class="subpanel-header">
            <strong>Batch review</strong>
            ${renderPill(screen.selectedDraft.batch.batchLabel, "accent")}
          </div>
          ${renderList([
            `Export batch ID: ${screen.selectedDraft.batch.id}`,
            `Destination: ${screen.selectedDraft.batch.destination}`,
            `Generated at: ${screen.selectedDraft.batch.generatedAt}`,
            `Generated by: ${screen.selectedDraft.batch.generatedBy}`,
            `Row count: ${String(screen.selectedDraft.batch.rowCount)}`,
            `Batch total: ${formatCurrencyKrw(screen.selectedDraft.batch.totalAmountKrw)}`
          ])}
          ${renderList(screen.selectedDraft.batch.reviewNotes)}
        </article>
        <article class="subpanel">
          <div class="subpanel-header">
            <strong>Correlated proof set</strong>
            ${renderPill("UI ↔ payload", "success")}
          </div>
          ${renderList([
            `Billing draft ID: ${screen.selectedDraft.id}`,
            `Export batch ID: ${screen.selectedDraft.batch.id}`,
            `Assignment IDs: ${assignmentIds.join(", ")}`,
            `Attendance IDs: ${attendanceIds.join(", ")}`
          ])}
        </article>
        <article class="subpanel">
          <div class="subpanel-header">
            <strong>Source trace</strong>
            ${renderPill("Traceable to attendance", "success")}
          </div>
          ${renderList(screen.selectedDraft.batch.sourceTrace)}
        </article>
        <article class="subpanel">
          <div class="subpanel-header">
            <strong>Line items</strong>
            ${renderPill("Batch-linked", "success")}
          </div>
          <table>
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Hours</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Source trace</th>
              </tr>
            </thead>
            <tbody>
              ${screen.selectedDraft.lineItems
                .map(
                  (line) => `
                    <tr>
                      <td>${escapeHtml(line.assignmentLabel)}</td>
                      <td>${String(line.hours)}</td>
                      <td>${escapeHtml(formatCurrencyKrw(line.billRateKrw))}</td>
                      <td>${escapeHtml(formatCurrencyKrw(line.amountKrw))}</td>
                      <td>
                        <strong>${escapeHtml(line.attendanceSource)}</strong>
                        <div class="muted">${escapeHtml(`${line.sourceAssignmentId} -> ${line.sourceAttendanceId}`)}</div>
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </article>
        <article class="subpanel">
          <div class="subpanel-header">
            <strong>Review summary</strong>
            ${renderPill("Audit-ready", "success")}
          </div>
          ${renderList(screen.selectedDraft.reviewSummary)}
        </article>
        <article class="subpanel">
          <div class="subpanel-header">
            <strong>Audit timeline</strong>
            ${renderPill("Finance proof", "success")}
          </div>
          ${renderAuditTimeline(screen.selectedDraft.auditTrail)}
        </article>
      </article>
    </section>
  `;
}

function renderSiteLeadRoster(shell: AdminShellState): string {
  const screen = shell.screens.siteLeadRoster;
  const pendingSyncCount = screen.shifts.filter(
    (shift) => shift.attendanceSyncStatus !== "Synced"
  ).length;
  const retryUploadCount = screen.shifts.filter(
    (shift) => shift.evidenceUploadStatus === "Retry required"
  ).length;
  const duplicateGuardCount = screen.shifts.filter(
    (shift) => shift.duplicateSubmitGuardNote !== null
  ).length;

  return `
    <section class="hero mobile-hero">
      <div>
        <p class="eyebrow">Mobile site-lead surface</p>
        <h1>${escapeHtml(screen.title)}</h1>
        <p class="lede">${escapeHtml(screen.subtitle)}</p>
      </div>
      <div class="hero-meta">
        ${renderPill(screen.shiftDate, "neutral")}
        ${renderPill(screen.siteName, "accent")}
      </div>
    </section>
    <section class="metric-grid mobile-metric-grid">
      <article class="metric-card metric-warning">
        <span class="metric-label">Pending sync</span>
        <strong>${String(pendingSyncCount)}</strong>
        <p>Queued mobile submissions still waiting on a stable network path.</p>
      </article>
      <article class="metric-card metric-danger">
        <span class="metric-label">Upload retry</span>
        <strong>${String(retryUploadCount)}</strong>
        <p>Evidence uploads that must resume without losing the selected roster record.</p>
      </article>
      <article class="metric-card metric-accent">
        <span class="metric-label">Duplicate guard</span>
        <strong>${String(duplicateGuardCount)}</strong>
        <p>Repeat taps blocked by a reused submit token instead of creating extra attendance rows.</p>
      </article>
    </section>
    <article class="panel mobile-panel">
      <header class="panel-header">
        <h2>${escapeHtml(screen.siteName)}</h2>
        <span>${escapeHtml(screen.leadName)}</span>
      </header>
      <div class="mobile-roster">
        ${screen.shifts
          .map(
            (shift) => `
              <article class="roster-card">
                <div class="candidate-head">
                  <strong>${escapeHtml(shift.workerName)}</strong>
                  ${renderPill(
                    shift.arrivalStatus,
                    shift.arrivalStatus === "Late risk"
                      ? "danger"
                      : shift.arrivalStatus === "Arrived"
                        ? "success"
                        : "neutral"
                  )}
                </div>
                <p>${escapeHtml(shift.role)} · ${escapeHtml(shift.plannedWindow)}</p>
                <p class="muted">${escapeHtml(shift.exceptionSummary)}</p>
                <div class="pill-row">
                  ${shift.quickActions.map((action) => renderPill(action, "accent")).join("")}
                </div>
                <div class="recovery-grid">
                  <section class="recovery-card">
                    <div class="candidate-head">
                      <strong>Attendance submit</strong>
                      ${renderPill(shift.attendanceSyncStatus, shift.attendanceSyncTone)}
                    </div>
                    <p class="muted">${escapeHtml(shift.attendanceSyncDetail)}</p>
                  </section>
                  <section class="recovery-card">
                    <div class="candidate-head">
                      <strong>Evidence upload</strong>
                      ${renderPill(shift.evidenceUploadStatus, shift.evidenceUploadTone)}
                    </div>
                    <p class="muted">${escapeHtml(shift.evidenceUploadDetail)}</p>
                  </section>
                </div>
                <ul class="recovery-meta">
                  <li>Attendance ID: ${escapeHtml(shift.attendanceRecordId)}</li>
                  <li>Submit token: ${escapeHtml(shift.submissionDedupeKey)}</li>
                  ${
                    shift.evidenceUploadId
                      ? `<li>Upload ID: ${escapeHtml(shift.evidenceUploadId)}</li>`
                      : ""
                  }
                  <li>Selected context: ${escapeHtml(shift.selectedRecordContext)}</li>
                  ${
                    shift.duplicateSubmitGuardNote
                      ? `<li>Duplicate guard: ${escapeHtml(shift.duplicateSubmitGuardNote)}</li>`
                      : ""
                  }
                  <li>Desktop convergence: ${escapeHtml(shift.desktopConvergenceNote)}</li>
                </ul>
              </article>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderNavigation(shell: AdminShellState): string {
  return `
    <nav class="nav">
      ${shell.navigation
        .map((item) => {
          const activeClass = item.id === shell.activeRoute ? " nav-link-active" : "";
          return `
            <a class="nav-link${activeClass}" href="#${item.id}">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.description)}</span>
            </a>
          `;
        })
        .join("")}
    </nav>
  `;
}

function renderRoute(shell: AdminShellState): string {
  switch (shell.activeRoute) {
    case "work-queue":
      return renderWorkQueue(shell);
    case "demand":
      return renderDemand(shell);
    case "placement":
      return renderPlacement(shell);
    case "attendance":
      return renderAttendance(shell);
    case "billing":
      return renderBilling(shell);
    case "site-lead-roster":
      return renderSiteLeadRoster(shell);
  }
}

function renderStyles(): string {
  return `
    <style>
      :root {
        --bg: #f6f2ea;
        --panel: rgba(255, 255, 255, 0.9);
        --panel-strong: #fffaf1;
        --ink: #1f2933;
        --muted: #66707c;
        --line: rgba(31, 41, 51, 0.11);
        --accent: #115e59;
        --accent-soft: rgba(17, 94, 89, 0.12);
        --success: #2f7d4a;
        --success-soft: rgba(47, 125, 74, 0.12);
        --warning: #b96a12;
        --warning-soft: rgba(185, 106, 18, 0.13);
        --danger: #a2373f;
        --danger-soft: rgba(162, 55, 63, 0.12);
        --shadow: 0 20px 44px rgba(31, 41, 51, 0.09);
        --radius: 22px;
        font-family: "IBM Plex Sans KR", "Pretendard", "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(17, 94, 89, 0.14), transparent 32%),
          linear-gradient(180deg, #fbf8f2 0%, #f3ede2 100%);
      }

      .canvas {
        min-height: 100vh;
        padding: 28px;
        background-image:
          linear-gradient(rgba(17, 94, 89, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 94, 89, 0.04) 1px, transparent 1px);
        background-size: 28px 28px;
      }

      .shell {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 22px;
      }

      .sidebar,
      .content {
        border: 1px solid var(--line);
        border-radius: calc(var(--radius) + 4px);
        background: var(--panel);
        box-shadow: var(--shadow);
        backdrop-filter: blur(10px);
      }

      .sidebar {
        padding: 24px 18px;
      }

      .content {
        padding: 28px;
      }

      .brand {
        margin-bottom: 22px;
      }

      .brand p,
      .hero p,
      .muted,
      th,
      td,
      span {
        color: var(--muted);
      }

      .brand strong {
        display: block;
        font-size: 1.15rem;
        color: var(--ink);
      }

      .nav {
        display: grid;
        gap: 10px;
      }

      .nav-link {
        display: grid;
        gap: 4px;
        padding: 14px 16px;
        color: inherit;
        text-decoration: none;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.72);
      }

      .nav-link-active {
        border-color: rgba(17, 94, 89, 0.4);
        background: var(--accent-soft);
      }

      .hero,
      .panel,
      .subpanel,
      .metric-card,
      .candidate-card,
      .draft-card,
      .roster-card,
      .alert,
      .timeline-entry {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--panel-strong);
      }

      .hero {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding: 24px;
        margin-bottom: 20px;
      }

      .hero.compact {
        align-items: center;
      }

      .eyebrow {
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-size: 0.73rem;
        font-weight: 700;
      }

      h1,
      h2,
      strong {
        color: var(--ink);
      }

      h1 {
        margin: 8px 0 10px;
        font-size: clamp(1.9rem, 2.8vw, 3rem);
        line-height: 1;
      }

      h2 {
        margin: 0;
        font-size: 1rem;
      }

      .lede {
        max-width: 64ch;
        margin: 0;
      }

      .hero-actions,
      .hero-meta,
      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: flex-start;
      }

      button,
      .pill {
        border-radius: 999px;
        border: 1px solid transparent;
        padding: 10px 14px;
        font: inherit;
      }

      button {
        background: var(--ink);
        color: white;
        cursor: default;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.87rem;
        color: var(--ink);
        background: rgba(31, 41, 51, 0.06);
      }

      .pill-accent {
        background: var(--accent-soft);
        color: var(--accent);
      }

      .pill-success {
        background: var(--success-soft);
        color: var(--success);
      }

      .pill-warning {
        background: var(--warning-soft);
        color: var(--warning);
      }

      .pill-danger {
        background: var(--danger-soft);
        color: var(--danger);
      }

      .metric-grid,
      .stack,
      .candidate-list,
      .draft-list,
      .alert-list,
      .mobile-roster,
      .timeline {
        display: grid;
        gap: 16px;
      }

      .metric-grid {
        grid-template-columns: repeat(5, minmax(0, 1fr));
        margin-bottom: 20px;
      }

      .metric-card {
        padding: 18px;
      }

      .metric-card strong {
        display: block;
        margin: 10px 0 6px;
        font-size: 2rem;
      }

      .two-column,
      .three-column {
        display: grid;
        gap: 18px;
      }

      .two-column {
        grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
      }

      .two-column.wide-right {
        grid-template-columns: minmax(0, 1.6fr) minmax(360px, 1fr);
      }

      .three-column {
        grid-template-columns: minmax(240px, 0.95fr) minmax(0, 1.3fr) minmax(320px, 1fr);
      }

      .panel,
      .subpanel,
      .candidate-card,
      .draft-card,
      .roster-card,
      .alert,
      .timeline-entry {
        padding: 18px;
      }

      .subpanel,
      .timeline-entry {
        background: white;
      }

      .panel-header,
      .subpanel-header,
      .candidate-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        text-align: left;
        vertical-align: top;
        padding: 12px 10px;
        border-top: 1px solid var(--line);
        font-size: 0.92rem;
      }

      thead th {
        border-top: 0;
        padding-top: 18px;
      }

      .delta-table th,
      .delta-table td {
        font-size: 0.84rem;
      }

      ul {
        margin: 12px 0 0;
        padding-left: 18px;
      }

      li + li {
        margin-top: 8px;
      }

      .tree-node + .tree-node {
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid var(--line);
      }

      .summary-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .summary-grid span {
        display: block;
        margin-bottom: 6px;
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .mobile-hero,
      .mobile-panel,
      .mobile-metric-grid {
        max-width: 520px;
        margin-inline: auto;
      }

      .mobile-metric-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .mobile-metric-grid .metric-card strong {
        font-size: 1.5rem;
      }

      .mobile-roster .roster-card {
        background: white;
      }

      .recovery-grid {
        display: grid;
        gap: 12px;
        margin-top: 14px;
      }

      .recovery-card {
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(246, 242, 234, 0.8);
      }

      .recovery-meta {
        margin: 14px 0 0;
      }

      @media (max-width: 1180px) {
        .shell,
        .three-column,
        .two-column,
        .two-column.wide-right,
        .metric-grid {
          grid-template-columns: 1fr;
        }

        .sidebar {
          order: 2;
        }
      }
    </style>
  `;
}

export function renderAdminDemoHtml(options: CreateAdminShellOptions = {}): string {
  const shell = createAdminDemoShell(options);
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Staffing Ops Admin Demo</title>
        ${renderStyles()}
      </head>
      <body>
        <main class="canvas">
          <div class="shell">
            <aside class="sidebar">
              <div class="brand">
                <p>${escapeHtml(shell.header.scopeLabel)}</p>
                <strong>${escapeHtml(shell.header.title)}</strong>
                <span>${escapeHtml(shell.header.subtitle)}</span>
              </div>
              ${renderNavigation(shell)}
            </aside>
            <section class="content" data-route="${escapeHtml(shell.activeRoute)}">
              ${renderRoute(shell)}
            </section>
          </div>
        </main>
      </body>
    </html>
  `;
}

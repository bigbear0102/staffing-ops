import {
  assignmentStatusDescriptors,
  attendanceStatusDescriptors,
  billingStatusDescriptors,
  demoOperatorDataset,
  orderStatusDescriptors,
  readinessDescriptors,
  type AttendanceRecord,
  type BillingDraftRecord,
  type DemoOrderRecord,
  type OperatorDashboardDataset,
  type PlacementCandidateRecord,
  type WorkQueueItem
} from "@staffing-ops/domain";

import { renderAdminDemoHtml } from "./render.js";
import {
  createAdminDemoShell,
  type AdminRouteId,
  type AdminShellState,
  type AdminViewport,
  type PlacementCommitRecord,
  type PlacementDecisionState
} from "./shell.js";

export interface AdminOperatorFlowState {
  readonly dataset: OperatorDashboardDataset;
  readonly viewport: AdminViewport;
  readonly activeRoute: AdminRouteId;
  readonly demandSelection: {
    readonly selectedOrderId: string;
    readonly editorOrderId: string;
  };
  readonly placementSelection: {
    readonly orderId: string;
    readonly selectedCandidateId: string;
  };
  readonly attendanceSelection: {
    readonly selectedRecordId: string;
  };
  readonly billingSelection: {
    readonly selectedDraftId: string;
  };
  readonly placementDecisionState: PlacementDecisionState;
  readonly lastPlacementCommit: PlacementCommitRecord | null;
}

export interface CreateAdminOperatorFlowOptions {
  readonly dataset?: OperatorDashboardDataset;
  readonly viewport?: AdminViewport;
  readonly activeRoute?: AdminRouteId;
  readonly demandOrderId?: string;
  readonly editorOrderId?: string;
  readonly placementOrderId?: string;
  readonly selectedCandidateId?: string;
  readonly selectedAttendanceId?: string;
  readonly selectedBillingDraftId?: string;
}

export type DemandOrderDraftPatch = Partial<
  Pick<
    DemoOrderRecord,
    | "attendanceApprovalMethod"
    | "billRateKrw"
    | "dateRange"
    | "headcount"
    | "nextAction"
    | "overtimeRule"
    | "shiftPattern"
  >
>;

export interface PlacementCommitOptions {
  readonly committedAt?: string;
  readonly committedBy?: string;
}

export interface AttendanceApprovalOptions {
  readonly approvedAt?: string;
  readonly approvedBy?: string;
}

function cloneDataset(dataset: OperatorDashboardDataset): OperatorDashboardDataset {
  return {
    workQueues: dataset.workQueues.map((item) => ({ ...item })),
    orders: dataset.orders.map((order) => ({
      ...order,
      blockers: [...order.blockers]
    })),
    placementCandidates: dataset.placementCandidates.map((candidate) => ({
      ...candidate,
      riskFlags: [...candidate.riskFlags],
      auditTrail: candidate.auditTrail.map((entry) => ({
        ...entry,
        sourceTrace: [...entry.sourceTrace],
        deltas: entry.deltas.map((delta) => ({ ...delta }))
      }))
    })),
    attendanceRecords: dataset.attendanceRecords.map((record) => ({
      ...record,
      auditTrail: record.auditTrail.map((entry) => ({
        ...entry,
        sourceTrace: [...entry.sourceTrace],
        deltas: entry.deltas.map((delta) => ({ ...delta }))
      }))
    })),
    billingDrafts: dataset.billingDrafts.map((draft) => ({
      ...draft,
      blockedBy: [...draft.blockedBy],
      manualAdjustments: [...draft.manualAdjustments],
      reviewSummary: [...draft.reviewSummary],
      auditTrail: draft.auditTrail.map((entry) => ({
        ...entry,
        sourceTrace: [...entry.sourceTrace],
        deltas: entry.deltas.map((delta) => ({ ...delta }))
      })),
      batch: {
        ...draft.batch,
        sourceTrace: [...draft.batch.sourceTrace],
        reviewNotes: [...draft.batch.reviewNotes]
      },
      lineItems: draft.lineItems.map((line) => ({ ...line }))
    })),
    siteLeadRoster: {
      ...dataset.siteLeadRoster,
      shifts: dataset.siteLeadRoster.shifts.map((shift) => ({
        ...shift,
        quickActions: [...shift.quickActions] as ["attendance", "exception", "evidence"]
      }))
    },
    alerts: dataset.alerts.map((alert) => ({ ...alert }))
  };
}

function getOrder(dataset: OperatorDashboardDataset, orderId: string): DemoOrderRecord {
  const order = dataset.orders.find((candidateOrder) => candidateOrder.id === orderId);

  if (!order) {
    throw new Error(`Expected order '${orderId}' to exist.`);
  }

  return order;
}

function getCandidate(
  dataset: OperatorDashboardDataset,
  candidateId: string
): PlacementCandidateRecord {
  const candidate = dataset.placementCandidates.find(
    (placementCandidate) => placementCandidate.id === candidateId
  );

  if (!candidate) {
    throw new Error(`Expected placement candidate '${candidateId}' to exist.`);
  }

  return candidate;
}

function getAttendanceRecord(
  dataset: OperatorDashboardDataset,
  recordId: string
): AttendanceRecord {
  const record = dataset.attendanceRecords.find((attendanceRecord) => attendanceRecord.id === recordId);

  if (!record) {
    throw new Error(`Expected attendance record '${recordId}' to exist.`);
  }

  return record;
}

function getBillingDraft(
  dataset: OperatorDashboardDataset,
  draftId: string
): BillingDraftRecord {
  const draft = dataset.billingDrafts.find((billingDraft) => billingDraft.id === draftId);

  if (!draft) {
    throw new Error(`Expected billing draft '${draftId}' to exist.`);
  }

  return draft;
}

function getCommercialBlockers(order: DemoOrderRecord): readonly string[] {
  const blockers: string[] = [];

  if (order.billRateKrw === null) {
    blockers.push("Bill rate is still missing.");
  }

  if (order.overtimeRule === null || order.overtimeRule.trim().length === 0) {
    blockers.push("Overtime rule still needs an explicit value.");
  }

  return blockers;
}

function resolveDemandOrderStatus(order: DemoOrderRecord): DemoOrderRecord["status"] {
  if (order.status === "in_service" || order.status === "closed" || order.status === "cancelled") {
    return order.status;
  }

  if (getCommercialBlockers(order).length > 0) {
    return "pending_commercial";
  }

  if (order.filledHeadcount >= order.headcount) {
    return "fully_filled";
  }

  if (order.filledHeadcount > 0) {
    return "partially_filled";
  }

  return "ready_for_staffing";
}

function buildQueueItemForOrder(
  order: DemoOrderRecord,
  existingItem?: WorkQueueItem
): WorkQueueItem | null {
  if (
    order.status === "fully_filled" ||
    order.status === "in_service" ||
    order.status === "closed" ||
    order.status === "cancelled"
  ) {
    return null;
  }

  const remainingHeadcount = Math.max(order.headcount - order.filledHeadcount, 0);
  const commercialBlockers = getCommercialBlockers(order);
  const queue =
    commercialBlockers.length > 0 || order.status === "pending_site_setup"
      ? "Compliance missing"
      : "Needs staffing";

  const blocker =
    queue === "Compliance missing"
      ? commercialBlockers.join(" ")
      : remainingHeadcount > 0
        ? `${String(remainingHeadcount)} heads still open for this order.`
        : "Ready for downstream staffing handoff.";

  const subtitle =
    queue === "Compliance missing"
      ? `${String(remainingHeadcount)} heads are blocked until demand terms are explicit`
      : `${String(remainingHeadcount)} open heads still need placement coverage`;

  return {
    id: existingItem?.id ?? `queue-${order.id}`,
    orderId: order.id,
    queue,
    title: existingItem?.title ?? `${order.siteName} / ${order.role}`,
    subtitle,
    owner: existingItem?.owner ?? "Ops desk A",
    urgency: existingItem?.urgency ?? (order.riskLevel === "critical" ? "Immediate" : "Today"),
    blocker,
    nextAction: order.nextAction
  };
}

function syncQueueForOrder(
  dataset: OperatorDashboardDataset,
  updatedOrder: DemoOrderRecord
): OperatorDashboardDataset {
  const existingItem = dataset.workQueues.find((item) => item.orderId === updatedOrder.id);
  const nextItem = buildQueueItemForOrder(updatedOrder, existingItem);
  const withoutOrderQueue = dataset.workQueues.filter((item) => item.orderId !== updatedOrder.id);

  return {
    ...dataset,
    workQueues: nextItem === null ? withoutOrderQueue : [...withoutOrderQueue, nextItem]
  };
}

function withUpdatedOrder(
  dataset: OperatorDashboardDataset,
  orderId: string,
  updater: (order: DemoOrderRecord) => DemoOrderRecord
): OperatorDashboardDataset {
  const nextOrders = dataset.orders.map((order) =>
    order.id === orderId ? updater(order) : order
  );
  const updatedOrder = getOrder({ ...dataset, orders: nextOrders }, orderId);

  return syncQueueForOrder(
    {
      ...dataset,
      orders: nextOrders
    },
    updatedOrder
  );
}

function withUpdatedCandidate(
  dataset: OperatorDashboardDataset,
  candidateId: string,
  updater: (candidate: PlacementCandidateRecord) => PlacementCandidateRecord
): OperatorDashboardDataset {
  return {
    ...dataset,
    placementCandidates: dataset.placementCandidates.map((candidate) =>
      candidate.id === candidateId ? updater(candidate) : candidate
    )
  };
}

function withUpdatedAttendanceRecord(
  dataset: OperatorDashboardDataset,
  recordId: string,
  updater: (record: AttendanceRecord) => AttendanceRecord
): OperatorDashboardDataset {
  return {
    ...dataset,
    attendanceRecords: dataset.attendanceRecords.map((record) =>
      record.id === recordId ? updater(record) : record
    )
  };
}

function withUpdatedBillingDraft(
  dataset: OperatorDashboardDataset,
  draftId: string,
  updater: (draft: BillingDraftRecord) => BillingDraftRecord
): OperatorDashboardDataset {
  return {
    ...dataset,
    billingDrafts: dataset.billingDrafts.map((draft) =>
      draft.id === draftId ? updater(draft) : draft
    )
  };
}

function buildPlacementDecisionState(
  candidate: PlacementCandidateRecord,
  overrideReason?: string | null
): PlacementDecisionState {
  const baseBlockers =
    candidate.readinessBadge === "Ready"
      ? []
      : candidate.riskFlags.length > 0
        ? [...candidate.riskFlags]
        : [readinessDescriptors[candidate.readinessBadge].detail];

  if (baseBlockers.length === 0) {
    return {
      canCommit: true,
      requiresOverride: false,
      overrideEnabled: false,
      overrideReason: null,
      blockerLabel: "Ready to assign",
      actionLabel: "Confirm assignment",
      blockerDetails: ["No visible blockers for this worker."]
    };
  }

  if (overrideReason && overrideReason.trim().length > 0) {
    return {
      canCommit: true,
      requiresOverride: true,
      overrideEnabled: true,
      overrideReason: overrideReason.trim(),
      blockerLabel: "Override armed",
      actionLabel: "Commit override",
      blockerDetails: [...baseBlockers, `Override reason: ${overrideReason.trim()}`]
    };
  }

  return {
    canCommit: false,
    requiresOverride: true,
    overrideEnabled: false,
    overrideReason: null,
    blockerLabel: "Commit blocked",
    actionLabel: "Override required",
    blockerDetails: baseBlockers
  };
}

function defaultSelectedCandidateId(dataset: OperatorDashboardDataset): string {
  return dataset.placementCandidates.find((candidate) => candidate.readinessBadge !== "Ready")?.id
    ?? dataset.placementCandidates[0]?.id
    ?? "candidate-minsu-lee";
}

export function createAdminOperatorFlow(
  options: CreateAdminOperatorFlowOptions = {}
): AdminOperatorFlowState {
  const dataset = cloneDataset(options.dataset ?? demoOperatorDataset);
  const selectedCandidateId = options.selectedCandidateId ?? defaultSelectedCandidateId(dataset);

  return {
    dataset,
    viewport: options.viewport ?? "desktop",
    activeRoute: options.activeRoute ?? "work-queue",
    demandSelection: {
      selectedOrderId: options.demandOrderId ?? "order-seoul-east-mall",
      editorOrderId: options.editorOrderId ?? "order-incheon-cold-chain"
    },
    placementSelection: {
      orderId: options.placementOrderId ?? "order-seoul-east-mall",
      selectedCandidateId
    },
    attendanceSelection: {
      selectedRecordId: options.selectedAttendanceId ?? "att-3"
    },
    billingSelection: {
      selectedDraftId: options.selectedBillingDraftId ?? "bill-2"
    },
    placementDecisionState: buildPlacementDecisionState(
      getCandidate(dataset, selectedCandidateId)
    ),
    lastPlacementCommit: null
  };
}

export function openDemandOrder(
  state: AdminOperatorFlowState,
  orderId: string
): AdminOperatorFlowState {
  getOrder(state.dataset, orderId);

  return {
    ...state,
    activeRoute: "demand",
    demandSelection: {
      selectedOrderId: orderId,
      editorOrderId: orderId
    }
  };
}

export function updateDemandOrderDraft(
  state: AdminOperatorFlowState,
  orderId: string,
  patch: DemandOrderDraftPatch
): AdminOperatorFlowState {
  const nextDataset = withUpdatedOrder(state.dataset, orderId, (order) => {
    const nextOrder = {
      ...order,
      ...patch
    };
    const nextStatus = resolveDemandOrderStatus(nextOrder);

    return {
      ...nextOrder,
      status: nextStatus,
      blockers: getCommercialBlockers(nextOrder),
      nextAction: nextStatus === "pending_commercial" ? "Resolve blockers" : "Publish order"
    };
  });

  return {
    ...state,
    dataset: nextDataset,
    activeRoute: "demand",
    demandSelection: {
      selectedOrderId: orderId,
      editorOrderId: orderId
    }
  };
}

export function publishDemandOrderDraft(
  state: AdminOperatorFlowState,
  orderId = state.demandSelection.editorOrderId
): AdminOperatorFlowState {
  const order = getOrder(state.dataset, orderId);
  const blockers = getCommercialBlockers(order);

  if (blockers.length > 0) {
    throw new Error(`Order '${orderId}' is not publish-ready: ${blockers.join(" ")}`);
  }

  const nextDataset = withUpdatedOrder(state.dataset, orderId, (existingOrder) => ({
    ...existingOrder,
    status: existingOrder.filledHeadcount > 0 ? "partially_filled" : "ready_for_staffing",
    blockers: [],
    nextAction: "Match workers"
  }));

  return {
    ...state,
    dataset: nextDataset,
    activeRoute: "demand",
    demandSelection: {
      selectedOrderId: orderId,
      editorOrderId: orderId
    }
  };
}

export function openPlacementOrder(
  state: AdminOperatorFlowState,
  orderId: string
): AdminOperatorFlowState {
  getOrder(state.dataset, orderId);
  const selectedCandidateId = state.placementSelection.selectedCandidateId;

  return {
    ...state,
    activeRoute: "placement",
    placementSelection: {
      orderId,
      selectedCandidateId
    },
    placementDecisionState: buildPlacementDecisionState(
      getCandidate(state.dataset, selectedCandidateId)
    )
  };
}

export function openAttendanceRecord(
  state: AdminOperatorFlowState,
  recordId: string
): AdminOperatorFlowState {
  const record = getAttendanceRecord(state.dataset, recordId);

  return {
    ...state,
    activeRoute: "attendance",
    attendanceSelection: {
      selectedRecordId: recordId
    },
    billingSelection: record.linkedBillingDraftId
      ? {
          selectedDraftId: record.linkedBillingDraftId
        }
      : state.billingSelection
  };
}

export function openBillingDraft(
  state: AdminOperatorFlowState,
  draftId: string
): AdminOperatorFlowState {
  getBillingDraft(state.dataset, draftId);

  return {
    ...state,
    activeRoute: "billing",
    billingSelection: {
      selectedDraftId: draftId
    }
  };
}

export function selectPlacementCandidate(
  state: AdminOperatorFlowState,
  candidateId: string
): AdminOperatorFlowState {
  const candidate = getCandidate(state.dataset, candidateId);

  return {
    ...state,
    activeRoute: "placement",
    placementSelection: {
      ...state.placementSelection,
      selectedCandidateId: candidateId
    },
    placementDecisionState: buildPlacementDecisionState(candidate)
  };
}

export function enablePlacementOverride(
  state: AdminOperatorFlowState,
  overrideReason: string
): AdminOperatorFlowState {
  const candidate = getCandidate(state.dataset, state.placementSelection.selectedCandidateId);

  return {
    ...state,
    activeRoute: "placement",
    placementDecisionState: buildPlacementDecisionState(candidate, overrideReason)
  };
}

export function commitSelectedPlacement(
  state: AdminOperatorFlowState,
  options: PlacementCommitOptions = {}
): AdminOperatorFlowState {
  const order = getOrder(state.dataset, state.placementSelection.orderId);
  const candidate = getCandidate(
    state.dataset,
    state.placementSelection.selectedCandidateId
  );

  if (!state.placementDecisionState.canCommit) {
    throw new Error(
      `Placement commit for '${candidate.workerName}' requires an override before confirmation.`
    );
  }

  if (candidate.assignmentStatus === "assigned" || candidate.assignmentStatus === "active") {
    throw new Error(`Candidate '${candidate.workerName}' is already committed.`);
  }

  const nextFilledHeadcount = Math.min(order.headcount, order.filledHeadcount + 1);
  const remainingHeadcount = Math.max(order.headcount - nextFilledHeadcount, 0);
  const nextOrderStatus = remainingHeadcount === 0 ? "fully_filled" : "partially_filled";
  const committedAt = options.committedAt ?? "2026-04-07T10:15:00+09:00";
  const committedBy = options.committedBy ?? "Operations Coordinator";
  const overrideReason = state.placementDecisionState.overrideEnabled
    ? state.placementDecisionState.overrideReason
    : null;

  const orderDataset = withUpdatedOrder(state.dataset, order.id, (existingOrder) => ({
    ...existingOrder,
    filledHeadcount: nextFilledHeadcount,
    status: nextOrderStatus,
    nextAction: remainingHeadcount === 0 ? "Review attendance" : "Match workers"
  }));

  const nextDataset = withUpdatedCandidate(orderDataset, candidate.id, (existingCandidate) => ({
    ...existingCandidate,
    assignmentStatus: "assigned",
    primaryAction: "Monitor arrival",
    riskFlags:
      overrideReason && !existingCandidate.riskFlags.some((flag) => flag.startsWith("Override"))
        ? [...existingCandidate.riskFlags, `Override approved: ${overrideReason}`]
        : existingCandidate.riskFlags,
    auditTrail: [
      {
        id: `placement-commit-${candidate.id}-${committedAt}`,
        title: overrideReason ? "Override commit captured" : "Assignment commit captured",
        actorName: committedBy,
        actorRole: "Operations Operator",
        occurredAt: committedAt,
        tone: overrideReason ? "warning" : "success",
        summary: `${candidate.workerName} moved into an assignment snapshot for ${order.siteName}.`,
        reason: overrideReason,
        sourceTrace: [
          `Assignment snapshot / assignment-${order.id}-${candidate.id}`,
          `Order ${order.id} -> candidate ${candidate.id}`
        ],
        deltas: [
          {
            label: "Assignment status",
            before: assignmentStatusDescriptors[existingCandidate.assignmentStatus].label,
            after: "Assigned"
          },
          {
            label: "Filled headcount",
            before: `${String(order.filledHeadcount)}/${String(order.headcount)}`,
            after: `${String(nextFilledHeadcount)}/${String(order.headcount)}`
          }
        ]
      },
      ...existingCandidate.auditTrail
    ]
  }));

  const orderStatusLabel = orderStatusDescriptors[nextOrderStatus].label;
  const lastPlacementCommit: PlacementCommitRecord = {
    orderId: order.id,
    candidateId: candidate.id,
    candidateName: candidate.workerName,
    assignmentId: `assignment-${order.id}-${candidate.id}`,
    committedAt,
    committedBy,
    mode: overrideReason ? "override" : "standard",
    overrideReason,
    remainingHeadcount,
    orderStatusLabel
  };

  return {
    ...state,
    dataset: nextDataset,
    activeRoute: "placement",
    placementDecisionState: {
      canCommit: false,
      requiresOverride: false,
      overrideEnabled: false,
      overrideReason: null,
      blockerLabel: "Assignment committed",
      actionLabel: "Committed",
      blockerDetails: [
        `${candidate.workerName} is now assigned to ${order.siteName}.`,
        `Remaining headcount: ${String(remainingHeadcount)}`
      ]
    },
    lastPlacementCommit
  };
}

export function approveAttendanceRecord(
  state: AdminOperatorFlowState,
  recordId = state.attendanceSelection.selectedRecordId,
  options: AttendanceApprovalOptions = {}
): AdminOperatorFlowState {
  const record = getAttendanceRecord(state.dataset, recordId);

  if (record.status === "site_review_pending" || record.actualWindow === "--") {
    throw new Error(`Attendance record '${recordId}' is still missing reviewable actual times.`);
  }

  if (record.status === "approved" || record.status === "locked_for_handoff") {
    throw new Error(`Attendance record '${recordId}' is already finance-ready.`);
  }

  const approvedAt = options.approvedAt ?? "2026-04-09 08:05 KST";
  const approvedBy = options.approvedBy ?? "Ops manager / J. Han";
  const previousStatus = record.status;
  const nextDataset = withUpdatedAttendanceRecord(state.dataset, recordId, (existingRecord) => ({
    ...existingRecord,
    status: "approved",
    primaryAction: "Queue for handoff",
    auditTrail: [
      {
        id: `attendance-approval-${recordId}-${approvedAt}`,
        title: "Attendance approved",
        actorName: approvedBy,
        actorRole: "Operations Manager",
        occurredAt: approvedAt,
        tone: "success",
        summary: `${existingRecord.workerName} cleared the approval gate and is now visible to finance.`,
        reason: existingRecord.reason,
        sourceTrace: [
          `Attendance row / ${existingRecord.id}`,
          existingRecord.linkedBillingDraftId
            ? `Billing draft / ${existingRecord.linkedBillingDraftId}`
            : "Attendance queue / unlinked"
        ],
        deltas: [
          {
            label: "Status",
            before: attendanceStatusDescriptors[previousStatus].label,
            after: "Approved"
          },
          {
            label: "Billing handoff",
            before: "Approval blocked",
            after: "Ready for handoff"
          }
        ]
      },
      ...existingRecord.auditTrail
    ]
  }));

  const linkedDraftId = record.linkedBillingDraftId;
  const billingUpdatedDataset = linkedDraftId
    ? withUpdatedBillingDraft(nextDataset, linkedDraftId, (draft) => ({
        ...draft,
        status: "ready_for_handoff",
        blockedBy: [],
        primaryAction: "Review export batch",
        reviewSummary: [
          `${record.id} cleared the approval gate and the draft is now handoff-ready.`,
          ...draft.reviewSummary
        ],
        auditTrail: [
          {
            id: `billing-unblock-${linkedDraftId}-${approvedAt}`,
            title: "Approval gate cleared",
            actorName: approvedBy,
            actorRole: "Operations Manager",
            occurredAt: approvedAt,
            tone: "success",
            summary: `${draft.clientName} is now reviewable as an export batch instead of a blocked finance item.`,
            reason: `Attendance ${record.id} moved from ${attendanceStatusDescriptors[previousStatus].label} to approved.`,
            sourceTrace: [`Attendance row / ${record.id}`, `Billing draft / ${draft.id}`],
            deltas: [
              {
                label: "Draft status",
                before: billingStatusDescriptors[draft.status].label,
                after: "Ready for handoff"
              },
              {
                label: "Primary action",
                before: draft.primaryAction,
                after: "Review export batch"
              }
            ]
          },
          ...draft.auditTrail
        ],
        batch: {
          ...draft.batch,
          generatedAt: approvedAt,
          generatedBy: approvedBy,
          sourceTrace: draft.batch.sourceTrace.map((item) =>
            item.includes(record.id) ? item.replace("exception pending", "approved") : item
          ),
          reviewNotes: [
            `Approval released by ${approvedBy} at ${approvedAt}.`,
            ...draft.batch.reviewNotes
          ]
        },
        lineItems: draft.lineItems.map((line) =>
          line.sourceAttendanceId === record.id
            ? {
                ...line,
                attendanceSource: line.attendanceSource.replace("exception pending", "approved")
              }
            : line
        )
      }))
    : nextDataset;

  return {
    ...state,
    dataset: billingUpdatedDataset,
    activeRoute: "attendance",
    attendanceSelection: {
      selectedRecordId: recordId
    },
    billingSelection: linkedDraftId
      ? {
          selectedDraftId: linkedDraftId
        }
      : state.billingSelection
  };
}

export function createAdminOperatorShell(
  state: AdminOperatorFlowState
): AdminShellState {
  return createAdminDemoShell({
    routeId: state.activeRoute,
    viewport: state.viewport,
    dataset: state.dataset,
    selectedOrderId: state.demandSelection.selectedOrderId,
    editorOrderId: state.demandSelection.editorOrderId,
    placementOrderId: state.placementSelection.orderId,
    selectedCandidateId: state.placementSelection.selectedCandidateId,
    selectedAttendanceId: state.attendanceSelection.selectedRecordId,
    selectedBillingDraftId: state.billingSelection.selectedDraftId,
    placementDecisionState: state.placementDecisionState,
    lastPlacementCommit: state.lastPlacementCommit
  });
}

export function renderAdminOperatorHtml(state: AdminOperatorFlowState): string {
  return renderAdminDemoHtml({
    routeId: state.activeRoute,
    viewport: state.viewport,
    dataset: state.dataset,
    selectedOrderId: state.demandSelection.selectedOrderId,
    editorOrderId: state.demandSelection.editorOrderId,
    placementOrderId: state.placementSelection.orderId,
    selectedCandidateId: state.placementSelection.selectedCandidateId,
    selectedAttendanceId: state.attendanceSelection.selectedRecordId,
    selectedBillingDraftId: state.billingSelection.selectedDraftId,
    placementDecisionState: state.placementDecisionState,
    lastPlacementCommit: state.lastPlacementCommit
  });
}

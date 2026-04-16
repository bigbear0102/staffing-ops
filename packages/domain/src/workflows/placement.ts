import type {
  Assignment,
  AssignmentCommitResult,
  AuditEvent,
  Order,
  OperatorRole,
  ServiceType,
  Worker,
  WorkerEligibilityBlocker,
  WorkerEligibilityCheck
} from "../entities.js";
import { authorizeRoleBoundary } from "../authorization.js";
import { createAuditEvent } from "../records.js";
import { createAssignment } from "./assignment.js";
import { applyAssignmentToOrder } from "./order.js";

export interface EvaluateWorkerEligibilityInput {
  readonly order: Order;
  readonly worker: Worker;
  readonly recentAssignmentConflict?: string;
}

export interface CommitAssignmentInput {
  readonly assignmentId: string;
  readonly order: Order;
  readonly worker: Worker;
  readonly actorUserId: string;
  readonly auditEventId: string;
  readonly committedAt: string;
  readonly sourceChannel: string;
  readonly payRateKrw: number;
  readonly serviceType: ServiceType;
  readonly effectiveDate: string;
  readonly overrideReason?: string;
  readonly recentAssignmentConflict?: string;
}

export interface CommitAssignmentWithAuthorizationInput extends CommitAssignmentInput {
  readonly actorRole: OperatorRole;
  readonly authorizationAuditEventId?: string;
}

export interface AssignmentCommitAuthorizationResult extends AssignmentCommitResult {
  readonly authorizationAuditEvent?: AuditEvent;
}

export function evaluateWorkerEligibility(
  input: EvaluateWorkerEligibilityInput
): WorkerEligibilityCheck {
  const blockers: WorkerEligibilityBlocker[] = [];
  const missingQualifications = input.order.requiredQualifications.filter(
    (qualification) => !input.worker.heldQualifications.includes(qualification)
  );

  if (input.worker.qualificationStatus !== "qualified") {
    blockers.push({
      code: "qualification_not_ready",
      detail: `Worker qualification status is ${input.worker.qualificationStatus}.`
    });
  }

  if (missingQualifications.length > 0) {
    blockers.push({
      code: "missing_qualification",
      detail: `Worker is missing required qualifications: ${missingQualifications.join(", ")}.`
    });
  }

  if (input.worker.documentReadiness !== "ready") {
    blockers.push({
      code: "document_not_ready",
      detail: `Worker document readiness is ${input.worker.documentReadiness}.`
    });
  }

  if (input.worker.availabilityStatus !== "available") {
    blockers.push({
      code: "worker_unavailable",
      detail: `Worker availability is ${input.worker.availabilityStatus}.`
    });
  }

  if (input.recentAssignmentConflict?.trim()) {
    blockers.push({
      code: "recent_assignment_conflict",
      detail: input.recentAssignmentConflict
    });
  }

  return {
    eligible: blockers.length === 0,
    overrideRequired: blockers.length > 0,
    requiredQualifications: [...input.order.requiredQualifications],
    missingQualifications,
    documentReadiness: input.worker.documentReadiness,
    availabilityStatus: input.worker.availabilityStatus,
    ...(input.recentAssignmentConflict
      ? { recentAssignmentConflict: input.recentAssignmentConflict }
      : {}),
    blockers
  };
}

export function commitAssignment(input: CommitAssignmentInput): AssignmentCommitResult {
  const eligibility = evaluateWorkerEligibility({
    order: input.order,
    worker: input.worker,
    ...(input.recentAssignmentConflict
      ? { recentAssignmentConflict: input.recentAssignmentConflict }
      : {})
  });

  if (!eligibility.eligible && !input.overrideReason?.trim()) {
    throw new Error(
      `Assignment commit requires override: ${eligibility.blockers
        .map((blocker) => blocker.detail)
        .join(" ")}`
    );
  }

  const assignmentBase = createAssignment({
    id: input.assignmentId,
    organizationId: input.order.organizationId,
    clientAccountId: input.order.clientAccountId,
    orderId: input.order.id,
    workerId: input.worker.id,
    siteId: input.order.siteId,
    payRateKrw: input.payRateKrw,
    billRateKrw: input.order.billRateKrw,
    shiftPattern: input.order.shiftPattern,
    effectiveDate: input.effectiveDate,
    serviceType: input.serviceType,
    plannedStartDate: input.order.startDate,
    plannedEndDate: input.order.endDate,
    sourceChannel: input.sourceChannel,
    createdAt: input.committedAt
  });

  const assignment: Assignment = {
    ...assignmentBase,
    status: "confirmed",
    updatedAt: input.committedAt
  };

  const order = applyAssignmentToOrder(input.order, input.committedAt);

  return {
    order,
    assignment,
    eligibility,
    auditEvent: createAuditEvent({
      id: input.auditEventId,
      organizationId: input.order.organizationId,
      module: "placement",
      entityType: "assignment",
      entityId: assignment.id,
      actorUserId: input.actorUserId,
      action: "assignment.committed",
      occurredAt: input.committedAt,
      payload: {
        before: {
          orderStatus: input.order.status,
          slotsFilled: input.order.slotsFilled
        },
        after: {
          orderStatus: order.status,
          slotsFilled: order.slotsFilled
        },
        orderId: input.order.id,
        workerId: input.worker.id,
        overrideReason: input.overrideReason ?? null,
        blockers: eligibility.blockers.map((blocker) => ({
          code: blocker.code,
          detail: blocker.detail
        }))
      }
    })
  };
}

export function commitAssignmentWithAuthorization(
  input: CommitAssignmentWithAuthorizationInput
): AssignmentCommitAuthorizationResult {
  const eligibility = evaluateWorkerEligibility({
    order: input.order,
    worker: input.worker,
    ...(input.recentAssignmentConflict
      ? { recentAssignmentConflict: input.recentAssignmentConflict }
      : {})
  });
  const overrideAttempted = eligibility.overrideRequired || Boolean(input.overrideReason?.trim());

  if (!overrideAttempted) {
    return commitAssignment(input);
  }

  if (!input.authorizationAuditEventId?.trim()) {
    throw new Error("Placement override authorization requires an audit event id.");
  }

  const authorizationAuditEvent = authorizeRoleBoundary({
    organizationId: input.order.organizationId,
    action: "placement_override",
    actor: {
      userId: input.actorUserId,
      role: input.actorRole
    },
    auditEventId: input.authorizationAuditEventId,
    occurredAt: input.committedAt,
    entityType: "assignment",
    entityId: input.assignmentId,
    context: {
      orderId: input.order.id,
      workerId: input.worker.id,
      overrideReason: input.overrideReason ?? null,
      blockers: eligibility.blockers.map((blocker) => ({
        code: blocker.code,
        detail: blocker.detail
      }))
    }
  });
  const result = commitAssignment(input);

  return {
    ...result,
    authorizationAuditEvent
  };
}

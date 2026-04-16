import {
  approveAttendance,
  type BillingHandoffRequest,
  type BillingHandoffExportLineInput,
  type InvoiceDraftRequest,
  RoleBoundaryAuthorizationError,
  commitAssignmentWithAuthorization,
  createOrder,
  type CreateOrderInput,
  generateBillingHandoffExportWithAuthorization,
  type OperatorRole,
  publishOrder,
  type ServiceType
} from "@staffing-ops/domain";
import {
  createBillingHandoffBatchRecord,
  type OperatorUserRecord,
  PersistenceConflictError,
  PersistenceNotFoundError,
  type StaffingPersistence
} from "@staffing-ops/db";
import {
  createBillingHandoffExportOutboxJob,
  createInvoiceDraftOutboxJob
} from "@staffing-ops/jobs";

export interface JsonApiError {
  readonly status: 400 | 403 | 404 | 409;
  readonly body: {
    readonly error: {
      readonly code: string;
      readonly message: string;
      readonly details?: Record<string, unknown>;
    };
  };
}

export interface JsonApiSuccess<T> {
  readonly status: 200 | 201;
  readonly body: T;
}

export type JsonApiResponse<T> = JsonApiSuccess<T> | JsonApiError;

export interface OrderIntakeJsonRequest {
  readonly orderId: string;
  readonly actorUserId: string;
  readonly createdAt: string;
  readonly publish?: {
    readonly auditEventId: string;
    readonly publishedAt: string;
  };
  readonly payload: Omit<CreateOrderInput, "id" | "createdAt">;
}

export interface OrderIntakeJsonResponse {
  readonly order: ReturnType<typeof createOrder>;
  readonly auditEventId?: string;
}

export interface PlacementCommitJsonRequest {
  readonly assignmentId: string;
  readonly orderId: string;
  readonly workerId: string;
  readonly actorUserId: string;
  readonly actorRole: OperatorRole;
  readonly auditEventId: string;
  readonly committedAt: string;
  readonly sourceChannel: string;
  readonly payRateKrw: number;
  readonly serviceType: ServiceType;
  readonly effectiveDate: string;
  readonly authorizationAuditEventId?: string;
  readonly overrideReason?: string;
  readonly recentAssignmentConflict?: string;
}

export interface PlacementCommitJsonResponse {
  readonly order: ReturnType<typeof createOrder>;
  readonly assignmentId: string;
  readonly assignmentStatus: string;
  readonly snapshotKey: string;
  readonly eligibility: ReturnType<typeof commitAssignmentWithAuthorization>["eligibility"];
  readonly auditEventIds: readonly string[];
}

export interface AttendanceApprovalJsonRequest {
  readonly assignmentId: string;
  readonly attendanceId: string;
  readonly billingHandoffRequestId: string;
  readonly approverUserId: string;
  readonly approvedAt: string;
  readonly auditEventId: string;
  readonly outboxJobId: string;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
}

export interface AttendanceApprovalJsonResponse {
  readonly attendanceId: string;
  readonly attendanceStatus: string;
  readonly billingHandoffRequest: BillingHandoffRequest;
  readonly outboxJobId: string;
  readonly auditEventId: string;
}

export interface BillingHandoffRequestLineInput {
  readonly requestId: string;
  readonly taxTreatmentCode?: BillingHandoffExportLineInput["taxTreatmentCode"];
  readonly supportingAttendanceEvidence?: BillingHandoffExportLineInput["supportingAttendanceEvidence"];
  readonly disputeNote?: string;
}

export interface BillingHandoffRequestJsonRequest {
  readonly exportBatchId: string;
  readonly generatedAt: string;
  readonly generatedByUserId: string;
  readonly actorRole: OperatorRole;
  readonly auditEventId: string;
  readonly authorizationAuditEventId: string;
  readonly outboxJobId: string;
  readonly lines: readonly BillingHandoffRequestLineInput[];
}

export interface BillingHandoffRequestJsonResponse {
  readonly exportBatchId: string;
  readonly exportedRequestIds: readonly string[];
  readonly rowCount: number;
  readonly outboxJobId: string;
  readonly auditEventIds: readonly string[];
}

function jsonError(
  status: JsonApiError["status"],
  code: string,
  message: string,
  details?: Record<string, unknown>
): JsonApiError {
  return {
    status,
    body: {
      error: {
        code,
        message,
        ...(details ? { details } : {})
      }
    }
  };
}

function toJsonApiError(error: unknown): JsonApiError {
  if (error instanceof PersistenceNotFoundError) {
    return jsonError(404, "not_found", error.message);
  }

  if (error instanceof PersistenceConflictError) {
    return jsonError(409, "conflict", error.message);
  }

  if (error instanceof Error) {
    return jsonError(400, "invalid_request", error.message);
  }

  return jsonError(400, "invalid_request", "Unknown API error.");
}

function createBillingHandoffRequest(
  requestId: string,
  invoiceDraftRequest: InvoiceDraftRequest
): BillingHandoffRequest {
  return {
    id: requestId,
    organizationId: invoiceDraftRequest.organizationId,
    clientAccountId: invoiceDraftRequest.clientAccountId,
    siteId: invoiceDraftRequest.siteId,
    workerId: invoiceDraftRequest.workerId,
    sourceAssignmentId: invoiceDraftRequest.sourceAssignmentId,
    sourceAttendanceId: invoiceDraftRequest.sourceAttendanceId,
    billingPeriodStart: invoiceDraftRequest.billingPeriodStart,
    billingPeriodEnd: invoiceDraftRequest.billingPeriodEnd,
    billRateKrw: invoiceDraftRequest.billRateKrw,
    status: "pending_export",
    requestedAt: invoiceDraftRequest.requestedAt,
    createdAt: invoiceDraftRequest.requestedAt,
    updatedAt: invoiceDraftRequest.requestedAt
  };
}

function toInvoiceDraftRequest(request: BillingHandoffRequest): InvoiceDraftRequest {
  return {
    organizationId: request.organizationId,
    clientAccountId: request.clientAccountId,
    siteId: request.siteId,
    workerId: request.workerId,
    sourceAssignmentId: request.sourceAssignmentId,
    sourceAttendanceId: request.sourceAttendanceId,
    billingPeriodStart: request.billingPeriodStart,
    billingPeriodEnd: request.billingPeriodEnd,
    billRateKrw: request.billRateKrw,
    requestedAt: request.requestedAt
  };
}

function requireOperatorUser(
  repository: StaffingPersistence,
  operatorUserId: string
): OperatorUserRecord {
  const operatorUser = repository.getOperatorUser(operatorUserId);

  if (!operatorUser) {
    throw new PersistenceNotFoundError(`Operator user ${operatorUserId} does not exist.`);
  }

  return operatorUser;
}

export function handleOrderIntake(
  repository: StaffingPersistence,
  request: OrderIntakeJsonRequest
): JsonApiResponse<OrderIntakeJsonResponse> {
  try {
    requireOperatorUser(repository, request.actorUserId);

    const draftOrder = createOrder({
      id: request.orderId,
      createdAt: request.createdAt,
      ...request.payload
    });

    repository.putOrder(draftOrder);

    if (!request.publish) {
      return {
        status: 201,
        body: {
          order: draftOrder
        }
      };
    }

    const published = publishOrder({
      order: draftOrder,
      actorUserId: request.actorUserId,
      auditEventId: request.publish.auditEventId,
      publishedAt: request.publish.publishedAt
    });

    repository.putOrder(published.order);
    repository.appendAuditEvent(published.auditEvent);

    return {
      status: 201,
      body: {
        order: published.order,
        auditEventId: published.auditEvent.id
      }
    };
  } catch (error) {
    return toJsonApiError(error);
  }
}

export function handlePlacementCommit(
  repository: StaffingPersistence,
  request: PlacementCommitJsonRequest
): JsonApiResponse<PlacementCommitJsonResponse> {
  try {
    const operatorUser = requireOperatorUser(repository, request.actorUserId);

    const order = repository.getOrder(request.orderId);

    if (!order) {
      throw new PersistenceNotFoundError(`Order ${request.orderId} does not exist.`);
    }

    const worker = repository.getWorker(request.workerId);

    if (!worker) {
      throw new PersistenceNotFoundError(`Worker ${request.workerId} does not exist.`);
    }

    const commit = commitAssignmentWithAuthorization({
      assignmentId: request.assignmentId,
      order,
      worker,
      actorUserId: request.actorUserId,
      actorRole: operatorUser.role,
      auditEventId: request.auditEventId,
      committedAt: request.committedAt,
      sourceChannel: request.sourceChannel,
      payRateKrw: request.payRateKrw,
      serviceType: request.serviceType,
      effectiveDate: request.effectiveDate,
      ...(request.authorizationAuditEventId
        ? { authorizationAuditEventId: request.authorizationAuditEventId }
        : {}),
      ...(request.overrideReason ? { overrideReason: request.overrideReason } : {}),
      ...(request.recentAssignmentConflict
        ? { recentAssignmentConflict: request.recentAssignmentConflict }
        : {})
    });

    repository.putOrder(commit.order);
    repository.putAssignment(commit.assignment);

    const auditEventIds = commit.authorizationAuditEvent
      ? [commit.authorizationAuditEvent.id, commit.auditEvent.id]
      : [commit.auditEvent.id];

    if (commit.authorizationAuditEvent) {
      repository.appendAuditEvent(commit.authorizationAuditEvent);
    }

    repository.appendAuditEvent(commit.auditEvent);

    return {
      status: 200,
      body: {
        order: commit.order,
        assignmentId: commit.assignment.id,
        assignmentStatus: commit.assignment.status,
        snapshotKey: `${commit.assignment.snapshot.orderId}:${commit.assignment.snapshot.workerId}:${commit.assignment.snapshot.effectiveDate}`,
        eligibility: commit.eligibility,
        auditEventIds
      }
    };
  } catch (error) {
    if (error instanceof RoleBoundaryAuthorizationError) {
      repository.appendAuditEvent(error.auditEvent);
      return jsonError(403, "role_boundary_denied", error.message, {
        auditEventId: error.auditEvent.id
      });
    }

    return toJsonApiError(error);
  }
}

export function handleAttendanceApproval(
  repository: StaffingPersistence,
  request: AttendanceApprovalJsonRequest
): JsonApiResponse<AttendanceApprovalJsonResponse> {
  try {
    requireOperatorUser(repository, request.approverUserId);

    const assignment = repository.getAssignment(request.assignmentId);

    if (!assignment) {
      throw new PersistenceNotFoundError(`Assignment ${request.assignmentId} does not exist.`);
    }

    const attendance = repository.getAttendance(request.attendanceId);

    if (!attendance) {
      throw new PersistenceNotFoundError(`Attendance ${request.attendanceId} does not exist.`);
    }

    const approval = approveAttendance({
      assignment,
      attendance,
      approverUserId: request.approverUserId,
      approvedAt: request.approvedAt,
      auditEventId: request.auditEventId,
      billingPeriodStart: request.billingPeriodStart,
      billingPeriodEnd: request.billingPeriodEnd
    });

    const outboxJob = createInvoiceDraftOutboxJob({
      jobId: request.outboxJobId,
      request: approval.invoiceDraftRequest,
      scheduledAt: request.approvedAt
    });

    const billingHandoffRequest = createBillingHandoffRequest(
      request.billingHandoffRequestId,
      approval.invoiceDraftRequest
    );

    repository.putAttendance(approval.attendance);
    repository.putBillingHandoffRequest(billingHandoffRequest);
    repository.appendAuditEvent(approval.auditEvent);
    repository.putOutboxJob(outboxJob);

    return {
      status: 200,
      body: {
        attendanceId: approval.attendance.id,
        attendanceStatus: approval.attendance.status,
        billingHandoffRequest,
        outboxJobId: outboxJob.id,
        auditEventId: approval.auditEvent.id
      }
    };
  } catch (error) {
    return toJsonApiError(error);
  }
}

export function handleBillingHandoffRequest(
  repository: StaffingPersistence,
  request: BillingHandoffRequestJsonRequest
): JsonApiResponse<BillingHandoffRequestJsonResponse> {
  try {
    requireOperatorUser(repository, request.generatedByUserId);

    const uniqueRequestIds = new Set<string>();

    for (const line of request.lines) {
      if (uniqueRequestIds.has(line.requestId)) {
        throw new Error(
          `Billing handoff request ${line.requestId} appears multiple times in the export payload.`
        );
      }

      uniqueRequestIds.add(line.requestId);
    }

    const lines = request.lines.map((line): BillingHandoffExportLineInput => {
      const billingHandoffRequest = repository.getBillingHandoffRequest(line.requestId);

      if (!billingHandoffRequest) {
        throw new PersistenceNotFoundError(
          `Billing handoff request ${line.requestId} does not exist.`
        );
      }

      if (billingHandoffRequest.status !== "pending_export") {
        throw new Error(
          `Billing handoff request ${line.requestId} is ${billingHandoffRequest.status} and cannot be exported.`
        );
      }

      const assignment = repository.getAssignment(billingHandoffRequest.sourceAssignmentId);

      if (!assignment) {
        throw new PersistenceNotFoundError(
          `Assignment ${billingHandoffRequest.sourceAssignmentId} does not exist.`
        );
      }

      const attendance = repository.getAttendance(billingHandoffRequest.sourceAttendanceId);

      if (!attendance) {
        throw new PersistenceNotFoundError(
          `Attendance ${billingHandoffRequest.sourceAttendanceId} does not exist.`
        );
      }

      return {
        invoiceDraftRequest: toInvoiceDraftRequest(billingHandoffRequest),
        assignment,
        attendance,
        ...(line.taxTreatmentCode ? { taxTreatmentCode: line.taxTreatmentCode } : {}),
        ...(line.supportingAttendanceEvidence
          ? { supportingAttendanceEvidence: line.supportingAttendanceEvidence }
          : {}),
        ...(line.disputeNote ? { disputeNote: line.disputeNote } : {})
      };
    });

    const exportEnvelope = generateBillingHandoffExportWithAuthorization({
      exportBatchId: request.exportBatchId,
      auditEventId: request.auditEventId,
      generatedAt: request.generatedAt,
      generatedByUserId: request.generatedByUserId,
      actorRole: request.actorRole,
      authorizationAuditEventId: request.authorizationAuditEventId,
      lines
    });

    const outboxJob = createBillingHandoffExportOutboxJob({
      jobId: request.outboxJobId,
      artifact: exportEnvelope.exportArtifact,
      scheduledAt: request.generatedAt
    });

    const batchRecord = createBillingHandoffBatchRecord(exportEnvelope.exportArtifact);

    repository.putBillingHandoffBatch(batchRecord);
    const exportedRequests = repository.markBillingHandoffRequestsExported(
      request.lines.map((line) => line.requestId),
      request.exportBatchId,
      request.generatedAt
    );

    repository.appendAuditEvent(exportEnvelope.authorizationAuditEvent);
    repository.appendAuditEvent(exportEnvelope.auditEvent);
    repository.putOutboxJob(outboxJob);

    return {
      status: 200,
      body: {
        exportBatchId: exportEnvelope.exportArtifact.exportBatchId,
        exportedRequestIds: exportedRequests.map((pendingRequest) => pendingRequest.id),
        rowCount: exportEnvelope.exportArtifact.rows.length,
        outboxJobId: outboxJob.id,
        auditEventIds: [
          exportEnvelope.authorizationAuditEvent.id,
          exportEnvelope.auditEvent.id
        ]
      }
    };
  } catch (error) {
    if (error instanceof RoleBoundaryAuthorizationError) {
      repository.appendAuditEvent(error.auditEvent);
      return jsonError(403, "role_boundary_denied", error.message, {
        auditEventId: error.auditEvent.id
      });
    }

    return toJsonApiError(error);
  }
}

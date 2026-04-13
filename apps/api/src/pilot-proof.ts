import { systemProfile } from "@staffing-ops/domain";
import {
  approveAttendance,
  commitAssignment,
  commitAssignmentWithAuthorization,
  correctAttendanceWithAuthorization,
  createOrder,
  generateBillingHandoffExportWithAuthorization,
  publishOrder,
  RoleBoundaryAuthorizationError,
  submitAttendance,
  type Assignment,
  type AssignmentCommitAuthorizationResult,
  type AssignmentCommitResult,
  type Attendance,
  type AttendanceApprovalResult,
  type AttendanceCorrectionAuthorizationResult,
  type AttendanceCorrectionResult,
  type AttendanceSubmissionResult,
  type AuditEvent,
  type BillingHandoffExportArtifact,
  type BillingHandoffExportAuthorizationResult,
  type InvoiceDraftRequest,
  type OperatorRole,
  type Order,
  type OutboxJob,
  type Worker
} from "@staffing-ops/domain";
import {
  createBillingHandoffExportOutboxJob,
  createInvoiceDraftOutboxJob
} from "@staffing-ops/jobs";

export const designPartnerPilotFixtureId = "design-partner-pilot-v1" as const;

export interface BillingHandoffBatchRecordShape {
  readonly id: string;
  readonly organizationId: string;
  readonly clientAccountId: string;
  readonly siteId: string;
  readonly batchKey: string;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
  readonly exportFormat: "csv";
  readonly generatedAt: string;
  readonly generatedByUserId: string;
  readonly sourceAttendanceIds: readonly string[];
  readonly sourceAssignmentSnapshots: BillingHandoffExportArtifact["sourceAssignmentSnapshots"];
  readonly artifactPayload: BillingHandoffExportArtifact;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ApprovedAttendanceProof {
  readonly attendance: Attendance;
  readonly submission: AttendanceSubmissionResult;
  readonly approval: AttendanceApprovalResult;
  readonly invoiceDraftRequest: InvoiceDraftRequest;
  readonly invoiceOutboxJob: OutboxJob;
}

export interface CorrectedReapprovalProof {
  readonly attendance: Attendance;
  readonly submission: AttendanceSubmissionResult;
  readonly initialApproval: AttendanceApprovalResult;
  readonly initialInvoiceOutboxJob: OutboxJob;
  readonly correction: AttendanceCorrectionResult;
  readonly reapproval: AttendanceApprovalResult;
  readonly reapprovalInvoiceOutboxJob: OutboxJob;
}

export interface BlockedAttendanceProof {
  readonly attendance: Attendance;
  readonly submission: AttendanceSubmissionResult;
  readonly blockerReason: string;
}

export interface MobileRetryRecoveryProof {
  readonly rosterShiftId: string;
  readonly pendingAttendanceId: string;
  readonly selectedRecordId: string;
  readonly submissionDedupeKey: string;
  readonly firstAttempt: {
    readonly networkState: "offline_after_submit";
    readonly queueStatus: "pending_sync";
    readonly capturedAt: string;
    readonly note: string;
  };
  readonly duplicateSubmissionGuard: {
    readonly secondTapAt: string;
    readonly dedupeKey: string;
    readonly attemptedAttendanceIds: readonly string[];
    readonly resultingAttendanceIds: readonly string[];
    readonly duplicatePrevented: boolean;
    readonly operatorMessage: string;
  };
  readonly evidenceUploadRecovery: {
    readonly uploadId: string;
    readonly fileName: string;
    readonly firstAttemptAt: string;
    readonly firstAttemptStatus: "failed";
    readonly retryAt: string;
    readonly retryStatus: "completed";
    readonly preservedRosterShiftId: string;
    readonly preservedSelectedRecordId: string;
    readonly note: string;
  };
  readonly desktopConvergence: {
    readonly attendanceId: string;
    readonly attendanceStatus: "submitted";
    readonly excludedFromExportBatch: boolean;
    readonly exportSourceAttendanceIds: readonly string[];
    readonly note: string;
  };
}

export interface PilotProofTrace {
  readonly orderId: string;
  readonly assignmentIds: readonly string[];
  readonly approvedAttendanceIds: readonly string[];
  readonly excludedAttendanceIds: readonly string[];
  readonly exportBatchId: string;
  readonly exportBatchKey: string;
}

export interface AllowedRoleBoundaryProof {
  readonly actorUserId: string;
  readonly actorRole: OperatorRole;
  readonly authorizationAuditEvent: AuditEvent;
  readonly resultingAuditEvent: AuditEvent;
}

export interface DeniedRoleBoundaryProof {
  readonly actorUserId: string;
  readonly actorRole: OperatorRole;
  readonly denialAuditEvent: AuditEvent;
  readonly errorMessage: string;
}

export interface RoleBoundaryProofBundle {
  readonly placementOverride: {
    readonly allowed: AllowedRoleBoundaryProof;
    readonly denied: DeniedRoleBoundaryProof;
  };
  readonly attendanceCorrection: {
    readonly allowed: AllowedRoleBoundaryProof;
    readonly denied: DeniedRoleBoundaryProof;
  };
  readonly billingExport: {
    readonly allowed: AllowedRoleBoundaryProof;
    readonly denied: DeniedRoleBoundaryProof;
  };
}

export interface DesignPartnerPilotProofBundle {
  readonly fixtureId: typeof designPartnerPilotFixtureId;
  readonly environmentName: "pilot-reviewable-proof";
  readonly timezone: typeof systemProfile.timezone;
  readonly operatorRolesUsed: readonly OperatorRole[];
  readonly order: {
    readonly draft: Order;
    readonly published: Order;
    readonly publishAuditEvent: AuditEvent;
  };
  readonly assignments: {
    readonly readyPath: AssignmentCommitResult;
    readonly overridePath: AssignmentCommitResult;
  };
  readonly attendance: {
    readonly cleanApproved: ApprovedAttendanceProof;
    readonly correctedReapproved: CorrectedReapprovalProof;
    readonly blockedUnapproved: BlockedAttendanceProof;
  };
  readonly mobileRecovery: MobileRetryRecoveryProof;
  readonly billing: {
    readonly exportArtifact: BillingHandoffExportArtifact;
    readonly exportAuditEvent: AuditEvent;
    readonly exportOutboxJob: OutboxJob;
    readonly eligibleAssignmentIds: readonly string[];
    readonly excludedAttendanceIds: readonly string[];
  };
  readonly permissions: RoleBoundaryProofBundle;
  readonly persistedRows: {
    readonly orders: readonly Order[];
    readonly assignments: readonly Assignment[];
    readonly attendance: readonly Attendance[];
    readonly billingHandoffBatch: BillingHandoffBatchRecordShape;
  };
  readonly trace: PilotProofTrace;
  readonly archivePayload: {
    readonly fixtureId: typeof designPartnerPilotFixtureId;
    readonly environmentName: "pilot-reviewable-proof";
    readonly timezone: typeof systemProfile.timezone;
    readonly operatorRolesUsed: readonly OperatorRole[];
    readonly trace: PilotProofTrace;
    readonly artifactPayload: BillingHandoffExportArtifact;
    readonly outboxPayload: OutboxJob["payload"];
  };
}

const actors = {
  adminUserId: "ops-admin-1",
  commercialOperatorUserId: "ops-commercial-1",
  placementOperatorUserId: "ops-placement-1",
  attendanceApproverUserId: "ops-manager-1",
  attendanceCorrectionUserId: "ops-attendance-2",
  siteLeadUserId: "site-lead-1",
  financeAdminUserId: "finance-admin-1"
} as const;

const ids = {
  organizationId: "org-design-partner-1",
  clientAccountId: "client-design-partner-1",
  siteId: "site-gimpo-cold-chain-1",
  readyWorkerId: "worker-ready-1",
  overrideWorkerId: "worker-override-1",
  orderId: "order-cold-chain-pilot-1",
  readyAssignmentId: "assignment-cold-chain-ready-1",
  overrideAssignmentId: "assignment-cold-chain-override-1",
  cleanAttendanceId: "attendance-clean-approved-1",
  correctedAttendanceId: "attendance-corrected-approved-1",
  blockedAttendanceId: "attendance-blocked-unapproved-1",
  exportBatchId: "billing-handoff-batch-pilot-1"
} as const;

const billingWindow = {
  start: "2026-04-01",
  end: "2026-04-30"
} as const;

const operatorRolesUsed = [
  "admin",
  "operations_operator",
  "operations_manager",
  "finance_admin",
  "site_lead"
] as const satisfies readonly OperatorRole[];

function captureDeniedRoleBoundaryProof(
  actorUserId: string,
  actorRole: OperatorRole,
  run: () => unknown
): DeniedRoleBoundaryProof {
  try {
    run();
  } catch (error) {
    if (error instanceof RoleBoundaryAuthorizationError) {
      return {
        actorUserId,
        actorRole,
        denialAuditEvent: error.auditEvent,
        errorMessage: error.message
      };
    }

    throw error;
  }

  throw new Error(`Expected ${actorRole} to be denied, but the action succeeded.`);
}

function createWorkerCatalog(): { readyWorker: Worker; overrideWorker: Worker } {
  const createdAt = "2026-04-01T08:00:00+09:00";

  return {
    readyWorker: {
      id: ids.readyWorkerId,
      organizationId: ids.organizationId,
      legalName: "Kim Ready",
      phoneE164: "+821012340001",
      residencyStatus: "citizen",
      skillTags: ["cold-chain", "warehouse"],
      heldQualifications: ["forklift", "cold-chain-check"],
      qualificationStatus: "qualified",
      documentReadiness: "ready",
      availabilityStatus: "available",
      availabilityDetail: "Available for pilot first-shift coverage.",
      payrollReference: "PAY-READY-1",
      active: true,
      createdAt,
      updatedAt: createdAt
    },
    overrideWorker: {
      id: ids.overrideWorkerId,
      organizationId: ids.organizationId,
      legalName: "Lee Override",
      phoneE164: "+821012340002",
      residencyStatus: "citizen",
      skillTags: ["cold-chain", "warehouse"],
      heldQualifications: ["forklift", "cold-chain-check"],
      qualificationStatus: "qualified",
      documentReadiness: "missing",
      availabilityStatus: "unavailable",
      availabilityDetail: "Recent assignment conflict still requires manager override.",
      payrollReference: "PAY-OVERRIDE-1",
      active: true,
      createdAt,
      updatedAt: createdAt
    }
  };
}

function createPublishedPilotOrder(): { draft: Order; published: Order; publishAuditEvent: AuditEvent } {
  const draft = createOrder({
    id: ids.orderId,
    organizationId: ids.organizationId,
    clientAccountId: ids.clientAccountId,
    siteId: ids.siteId,
    roleCode: "cold-chain-picker",
    headcountRequired: 2,
    requiredQualifications: ["forklift", "cold-chain-check"],
    startDate: "2026-04-03",
    endDate: "2026-04-30",
    shiftPattern: "weekday-day",
    billRateKrw: 19000,
    overtimeRuleCode: "kr-standard-meal-after-8h",
    createdAt: "2026-04-01T09:00:00+09:00"
  });

  const published = publishOrder({
    order: draft,
    actorUserId: actors.commercialOperatorUserId,
    auditEventId: "audit-order-published-pilot-1",
    publishedAt: "2026-04-01T09:30:00+09:00"
  });

  return {
    draft,
    published: published.order,
    publishAuditEvent: published.auditEvent
  };
}

function createCapturedAttendance(
  id: string,
  assignmentId: string,
  workDate: string,
  actualStartAt: string,
  actualEndAt: string,
  overtimeMinutes: number,
  exceptionCode?: string
): Attendance {
  const createdAt = `${workDate}T18:00:00+09:00`;

  return {
    id,
    organizationId: ids.organizationId,
    assignmentId,
    workDate,
    scheduledStartAt: `${workDate}T09:00:00+09:00`,
    scheduledEndAt: `${workDate}T18:00:00+09:00`,
    actualStartAt,
    actualEndAt,
    breakMinutes: 60,
    overtimeMinutes,
    status: "captured",
    source: "site_lead_mobile",
    ...(exceptionCode ? { exceptionCode } : {}),
    createdAt,
    updatedAt: createdAt
  };
}

function createInvoiceDraftOutboxJobForApproval(
  jobId: string,
  approval: AttendanceApprovalResult,
  scheduledAt: string
): OutboxJob {
  return createInvoiceDraftOutboxJob({
    jobId,
    request: approval.invoiceDraftRequest,
    scheduledAt
  });
}

function buildMobileRetryRecoveryProof(
  blockedSubmission: AttendanceSubmissionResult,
  exportArtifact: BillingHandoffExportArtifact
): MobileRetryRecoveryProof {
  const attemptedAttendanceIds = [
    blockedSubmission.attendance.id,
    blockedSubmission.attendance.id
  ] as const;
  const resultingAttendanceIds = [...new Set(attemptedAttendanceIds)];

  return {
    rosterShiftId: "roster-mobile-pilot-1",
    pendingAttendanceId: blockedSubmission.attendance.id,
    selectedRecordId: blockedSubmission.attendance.id,
    submissionDedupeKey: `site-lead-mobile:${blockedSubmission.attendance.id}:submit`,
    firstAttempt: {
      networkState: "offline_after_submit",
      queueStatus: "pending_sync",
      capturedAt: blockedSubmission.auditEvent.occurredAt,
      note:
        "The site lead kept the captured attendance locally after the network dropped during submit."
    },
    duplicateSubmissionGuard: {
      secondTapAt: "2026-04-05T18:12:00+09:00",
      dedupeKey: `site-lead-mobile:${blockedSubmission.attendance.id}:submit`,
      attemptedAttendanceIds: [...attemptedAttendanceIds],
      resultingAttendanceIds,
      duplicatePrevented: resultingAttendanceIds.length === 1,
      operatorMessage:
        "Retry reused the pending submit token, so the roster stayed on one attendance record instead of creating a duplicate."
    },
    evidenceUploadRecovery: {
      uploadId: `evidence-upload:${blockedSubmission.attendance.id}:gate-photo`,
      fileName: "gate-clearance-photo.jpg",
      firstAttemptAt: "2026-04-05T18:13:00+09:00",
      firstAttemptStatus: "failed",
      retryAt: "2026-04-05T18:19:00+09:00",
      retryStatus: "completed",
      preservedRosterShiftId: "roster-mobile-pilot-1",
      preservedSelectedRecordId: blockedSubmission.attendance.id,
      note:
        "The evidence retry resumed on the same selected roster record after reload, preserving the operator's context."
    },
    desktopConvergence: {
      attendanceId: blockedSubmission.attendance.id,
      attendanceStatus: "submitted",
      excludedFromExportBatch: !exportArtifact.sourceAttendanceIds.includes(
        blockedSubmission.attendance.id
      ),
      exportSourceAttendanceIds: [...exportArtifact.sourceAttendanceIds],
      note:
        "Once connectivity resumed, desktop review showed the same submitted attendance row still blocked out of finance handoff until site evidence cleared."
    }
  };
}

export function buildDesignPartnerPilotProofBundle(): DesignPartnerPilotProofBundle {
  const { readyWorker, overrideWorker } = createWorkerCatalog();
  const order = createPublishedPilotOrder();

  const readyPath = commitAssignment({
    assignmentId: ids.readyAssignmentId,
    order: order.published,
    worker: readyWorker,
    actorUserId: actors.placementOperatorUserId,
    auditEventId: "audit-assignment-ready-pilot-1",
    committedAt: "2026-04-02T09:00:00+09:00",
    sourceChannel: "operator_console",
    payRateKrw: 14000,
    serviceType: "dispatch",
    effectiveDate: "2026-04-03"
  });

  const deniedPlacementOverride = captureDeniedRoleBoundaryProof(
    actors.placementOperatorUserId,
    "operations_operator",
    () => {
      commitAssignmentWithAuthorization({
        assignmentId: "assignment-cold-chain-override-denied-1",
        order: readyPath.order,
        worker: overrideWorker,
        actorUserId: actors.placementOperatorUserId,
        actorRole: "operations_operator",
        auditEventId: "audit-assignment-override-denied-pilot-1",
        authorizationAuditEventId: "audit-assignment-override-denied-auth-pilot-1",
        committedAt: "2026-04-02T09:12:00+09:00",
        sourceChannel: "operator_console",
        payRateKrw: 14500,
        serviceType: "dispatch",
        effectiveDate: "2026-04-03",
        overrideReason:
          "Operations operator attempted to bypass the missing evidence gate without manager approval.",
        recentAssignmentConflict:
          "Previous site released the worker late; first-shift deployment required explicit pilot override."
      });
    }
  );

  const overridePath: AssignmentCommitAuthorizationResult = commitAssignmentWithAuthorization({
    assignmentId: ids.overrideAssignmentId,
    order: readyPath.order,
    worker: overrideWorker,
    actorUserId: actors.adminUserId,
    actorRole: "admin",
    auditEventId: "audit-assignment-override-pilot-1",
    authorizationAuditEventId: "audit-assignment-override-auth-pilot-1",
    committedAt: "2026-04-02T09:15:00+09:00",
    sourceChannel: "operator_console",
    payRateKrw: 14500,
    serviceType: "dispatch",
    effectiveDate: "2026-04-03",
    overrideReason:
      "Operations manager approved temporary deployment while missing compliance evidence is collected.",
    recentAssignmentConflict:
      "Previous site released the worker late; first-shift deployment required explicit pilot override."
  });

  const cleanSubmission = submitAttendance({
    attendance: createCapturedAttendance(
      ids.cleanAttendanceId,
      readyPath.assignment.id,
      "2026-04-03",
      "2026-04-03T09:00:00+09:00",
      "2026-04-03T18:15:00+09:00",
      15
    ),
    submittedByUserId: actors.siteLeadUserId,
    submittedAt: "2026-04-03T18:20:00+09:00",
    auditEventId: "audit-attendance-submit-clean-pilot-1"
  });

  const cleanApproval = approveAttendance({
    assignment: readyPath.assignment,
    attendance: cleanSubmission.attendance,
    approverUserId: actors.attendanceApproverUserId,
    approvedAt: "2026-04-03T18:35:00+09:00",
    auditEventId: "audit-attendance-approve-clean-pilot-1",
    billingPeriodStart: billingWindow.start,
    billingPeriodEnd: billingWindow.end
  });

  const cleanInvoiceOutboxJob = createInvoiceDraftOutboxJobForApproval(
    "job-invoice-clean-pilot-1",
    cleanApproval,
    cleanApproval.attendance.approvedAt!
  );

  const correctedSubmission = submitAttendance({
    attendance: createCapturedAttendance(
      ids.correctedAttendanceId,
      overridePath.assignment.id,
      "2026-04-04",
      "2026-04-04T08:58:00+09:00",
      "2026-04-04T18:05:00+09:00",
      5
    ),
    submittedByUserId: actors.siteLeadUserId,
    submittedAt: "2026-04-04T18:08:00+09:00",
    auditEventId: "audit-attendance-submit-corrected-pilot-1"
  });

  const initialApproval = approveAttendance({
    assignment: overridePath.assignment,
    attendance: correctedSubmission.attendance,
    approverUserId: actors.attendanceApproverUserId,
    approvedAt: "2026-04-04T18:25:00+09:00",
    auditEventId: "audit-attendance-approve-before-correction-pilot-1",
    billingPeriodStart: billingWindow.start,
    billingPeriodEnd: billingWindow.end
  });

  const initialInvoiceOutboxJob = createInvoiceDraftOutboxJobForApproval(
    "job-invoice-corrected-initial-pilot-1",
    initialApproval,
    initialApproval.attendance.approvedAt!
  );

  const deniedAttendanceCorrection = captureDeniedRoleBoundaryProof(
    actors.siteLeadUserId,
    "site_lead",
    () => {
      correctAttendanceWithAuthorization({
        attendance: initialApproval.attendance,
        correctedByUserId: actors.siteLeadUserId,
        actorRole: "site_lead",
        correctedAt: "2026-04-05T08:55:00+09:00",
        auditEventId: "audit-attendance-corrected-denied-pilot-1",
        authorizationAuditEventId: "audit-attendance-corrected-denied-auth-pilot-1",
        correctionReason: "Site lead attempted to revise hours without operator review.",
        actualEndAt: "2026-04-04T18:20:00+09:00",
        overtimeMinutes: 20
      });
    }
  );

  const correction: AttendanceCorrectionAuthorizationResult = correctAttendanceWithAuthorization({
    attendance: initialApproval.attendance,
    correctedByUserId: actors.attendanceCorrectionUserId,
    actorRole: "operations_operator",
    correctedAt: "2026-04-05T09:00:00+09:00",
    auditEventId: "audit-attendance-corrected-pilot-1",
    authorizationAuditEventId: "audit-attendance-corrected-auth-pilot-1",
    correctionReason: "Driver log and freezer-gate evidence confirmed additional overtime minutes.",
    actualEndAt: "2026-04-04T18:42:00+09:00",
    overtimeMinutes: 42
  });

  const reapproval = approveAttendance({
    assignment: overridePath.assignment,
    attendance: correction.attendance,
    approverUserId: actors.attendanceApproverUserId,
    approvedAt: "2026-04-05T09:15:00+09:00",
    auditEventId: "audit-attendance-reapproved-pilot-1",
    billingPeriodStart: billingWindow.start,
    billingPeriodEnd: billingWindow.end
  });

  const reapprovalInvoiceOutboxJob = createInvoiceDraftOutboxJobForApproval(
    "job-invoice-corrected-reapproved-pilot-1",
    reapproval,
    reapproval.attendance.approvedAt!
  );

  const blockedSubmission = submitAttendance({
    attendance: createCapturedAttendance(
      ids.blockedAttendanceId,
      overridePath.assignment.id,
      "2026-04-05",
      "2026-04-05T09:03:00+09:00",
      "2026-04-05T18:01:00+09:00",
      1,
      "site_signoff_missing"
    ),
    submittedByUserId: actors.siteLeadUserId,
    submittedAt: "2026-04-05T18:10:00+09:00",
    auditEventId: "audit-attendance-submit-blocked-pilot-1"
  });

  const deniedBillingExport = captureDeniedRoleBoundaryProof(
    actors.siteLeadUserId,
    "site_lead",
    () => {
      generateBillingHandoffExportWithAuthorization({
        exportBatchId: "billing-handoff-batch-pilot-denied-1",
        auditEventId: "audit-export-denied-pilot-1",
        authorizationAuditEventId: "audit-export-denied-auth-pilot-1",
        generatedAt: "2026-04-07T08:50:00+09:00",
        generatedByUserId: actors.siteLeadUserId,
        actorRole: "site_lead",
        lines: [
          {
            invoiceDraftRequest: cleanApproval.invoiceDraftRequest,
            assignment: readyPath.assignment,
            attendance: cleanApproval.attendance
          }
        ]
      });
    }
  );

  const exportResult: BillingHandoffExportAuthorizationResult = generateBillingHandoffExportWithAuthorization({
    exportBatchId: ids.exportBatchId,
    auditEventId: "audit-export-pilot-1",
    authorizationAuditEventId: "audit-export-auth-pilot-1",
    generatedAt: "2026-04-07T09:00:00+09:00",
    generatedByUserId: actors.financeAdminUserId,
    actorRole: "finance_admin",
    lines: [
      {
        invoiceDraftRequest: cleanApproval.invoiceDraftRequest,
        assignment: readyPath.assignment,
        attendance: cleanApproval.attendance,
        supportingAttendanceEvidence: [
          "doc://attendance/clean-approved-timesheet.pdf"
        ]
      },
      {
        invoiceDraftRequest: reapproval.invoiceDraftRequest,
        assignment: overridePath.assignment,
        attendance: reapproval.attendance,
        supportingAttendanceEvidence: [
          "doc://attendance/corrected-overtime-proof.pdf"
        ],
        disputeNote: "Correction reapplied before finance handoff close."
      }
    ]
  });

  const exportOutboxJob = createBillingHandoffExportOutboxJob({
    jobId: "job-export-pilot-1",
    artifact: exportResult.exportArtifact,
    scheduledAt: exportResult.exportArtifact.generatedAt
  });
  const mobileRecovery = buildMobileRetryRecoveryProof(
    blockedSubmission,
    exportResult.exportArtifact
  );

  const excludedAttendanceIds = [blockedSubmission.attendance.id] as const;
  const trace: PilotProofTrace = {
    orderId: order.published.id,
    assignmentIds: [readyPath.assignment.id, overridePath.assignment.id],
    approvedAttendanceIds: [...exportResult.exportArtifact.sourceAttendanceIds],
    excludedAttendanceIds: [...excludedAttendanceIds],
    exportBatchId: exportResult.exportArtifact.exportBatchId,
    exportBatchKey: exportResult.exportArtifact.batchKey
  };

  const billingHandoffBatch: BillingHandoffBatchRecordShape = {
    id: exportResult.exportArtifact.exportBatchId,
    organizationId: exportResult.exportArtifact.organizationId,
    clientAccountId: exportResult.exportArtifact.clientAccountId,
    siteId: exportResult.exportArtifact.siteId,
    batchKey: exportResult.exportArtifact.batchKey,
    billingPeriodStart: exportResult.exportArtifact.billingPeriodStart,
    billingPeriodEnd: exportResult.exportArtifact.billingPeriodEnd,
    exportFormat: exportResult.exportArtifact.format,
    generatedAt: exportResult.exportArtifact.generatedAt,
    generatedByUserId: exportResult.exportArtifact.generatedByUserId,
    sourceAttendanceIds: [...exportResult.exportArtifact.sourceAttendanceIds],
    sourceAssignmentSnapshots: [...exportResult.exportArtifact.sourceAssignmentSnapshots],
    artifactPayload: exportResult.exportArtifact,
    createdAt: exportResult.exportArtifact.generatedAt,
    updatedAt: exportResult.exportArtifact.generatedAt
  };

  const permissions: RoleBoundaryProofBundle = {
    placementOverride: {
      allowed: {
        actorUserId: actors.adminUserId,
        actorRole: "admin",
        authorizationAuditEvent: overridePath.authorizationAuditEvent!,
        resultingAuditEvent: overridePath.auditEvent
      },
      denied: deniedPlacementOverride
    },
    attendanceCorrection: {
      allowed: {
        actorUserId: actors.attendanceCorrectionUserId,
        actorRole: "operations_operator",
        authorizationAuditEvent: correction.authorizationAuditEvent,
        resultingAuditEvent: correction.auditEvent
      },
      denied: deniedAttendanceCorrection
    },
    billingExport: {
      allowed: {
        actorUserId: actors.financeAdminUserId,
        actorRole: "finance_admin",
        authorizationAuditEvent: exportResult.authorizationAuditEvent,
        resultingAuditEvent: exportResult.auditEvent
      },
      denied: deniedBillingExport
    }
  };

  return {
    fixtureId: designPartnerPilotFixtureId,
    environmentName: "pilot-reviewable-proof",
    timezone: systemProfile.timezone,
    operatorRolesUsed: [...operatorRolesUsed],
    order,
    assignments: {
      readyPath,
      overridePath
    },
    attendance: {
      cleanApproved: {
        attendance: cleanApproval.attendance,
        submission: cleanSubmission,
        approval: cleanApproval,
        invoiceDraftRequest: cleanApproval.invoiceDraftRequest,
        invoiceOutboxJob: cleanInvoiceOutboxJob
      },
      correctedReapproved: {
        attendance: reapproval.attendance,
        submission: correctedSubmission,
        initialApproval,
        initialInvoiceOutboxJob,
        correction,
        reapproval,
        reapprovalInvoiceOutboxJob
      },
      blockedUnapproved: {
        attendance: blockedSubmission.attendance,
        submission: blockedSubmission,
        blockerReason:
          "Site lead evidence was missing at cutoff, so the row stays out of billing handoff."
      }
    },
    mobileRecovery,
    billing: {
      exportArtifact: exportResult.exportArtifact,
      exportAuditEvent: exportResult.auditEvent,
      exportOutboxJob,
      eligibleAssignmentIds: exportResult.exportArtifact.sourceAssignmentSnapshots.map(
        (snapshot: BillingHandoffExportArtifact["sourceAssignmentSnapshots"][number]) =>
          snapshot.assignmentId
      ),
      excludedAttendanceIds: [...excludedAttendanceIds]
    },
    permissions,
    persistedRows: {
      orders: [order.published],
      assignments: [readyPath.assignment, overridePath.assignment],
      attendance: [
        cleanApproval.attendance,
        reapproval.attendance,
        blockedSubmission.attendance
      ],
      billingHandoffBatch
    },
    trace,
    archivePayload: {
      fixtureId: designPartnerPilotFixtureId,
      environmentName: "pilot-reviewable-proof",
      timezone: systemProfile.timezone,
      operatorRolesUsed: [...operatorRolesUsed],
      trace,
      artifactPayload: exportResult.exportArtifact,
      outboxPayload: exportOutboxJob.payload
    }
  };
}

export const designPartnerPilotProofBundle = buildDesignPartnerPilotProofBundle();

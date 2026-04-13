import { staffingDbManifest } from "@staffing-ops/db";
import {
  coreModules,
  commitAssignmentWithAuthorization,
  correctAttendanceWithAuthorization,
  createAssignment,
  createOrder,
  publishOrder,
  approveAttendance,
  generateBillingHandoffExportWithAuthorization,
  submitAttendance,
  systemProfile,
  type Assignment,
  type AssignmentCommitAuthorizationResult,
  type AssignmentSnapshot,
  type Attendance,
  type AuditEvent,
  type BillingHandoffExportArtifact,
  type BillingHandoffExportAuthorizationResult,
  type AttendanceCorrectionAuthorizationResult,
  type AttendanceSubmissionResult,
  type BillingHandoffExportLineInput,
  type CorrectAttendanceInput,
  type CreateAssignmentInput,
  type CreateOrderInput,
  type InvoiceDraftRequest,
  type OperatorRole,
  type Order,
  type OutboxJob,
  type PublishOrderResult,
  type SubmitAttendanceInput,
  type Worker,
  type WorkerEligibilityCheck
} from "@staffing-ops/domain";
import {
  createBillingHandoffExportOutboxJob,
  createInvoiceDraftOutboxJob,
  jobQueueManifest
} from "@staffing-ops/jobs";

export const apiServiceManifest = {
  service: "staffing-ops-api",
  runtime: "node",
  timezone: systemProfile.timezone,
  currency: systemProfile.currency,
  ownedModules: [...coreModules],
  persistenceTables: [...staffingDbManifest.coreTables],
  jobTopics: [...jobQueueManifest.supportedTopics],
  workflowInterfaces: [
    "order_intake",
    "assignment_commit",
    "assignment_override_authorization",
    "assignment_snapshot",
    "attendance_submit",
    "attendance_correction",
    "attendance_correction_authorization",
    "attendance_approval",
    "invoice_draft_request",
    "finance_handoff_export",
    "finance_handoff_export_authorization"
  ]
} as const;

export function formatAssignmentAuditKey(snapshot: AssignmentSnapshot): string {
  return `${snapshot.orderId}:${snapshot.workerId}:${snapshot.effectiveDate}`;
}

export const bootstrapAssignmentRecord = createAssignment;
export const bootstrapOrderRecord = createOrder;

export interface AssignmentCommitEnvelope extends AssignmentCommitAuthorizationResult {
  readonly order: Order;
  readonly assignment: Assignment;
  readonly auditEvent: AuditEvent;
  readonly eligibility: WorkerEligibilityCheck;
}

export interface BuildAssignmentCommitEnvelopeInput {
  readonly assignmentId: string;
  readonly order: Order;
  readonly worker: Worker;
  readonly actorUserId: string;
  readonly actorRole: OperatorRole;
  readonly auditEventId: string;
  readonly committedAt: string;
  readonly sourceChannel: string;
  readonly payRateKrw: number;
  readonly serviceType: "dispatch" | "subcontracting" | "outsourcing";
  readonly effectiveDate: string;
  readonly authorizationAuditEventId?: string;
  readonly overrideReason?: string;
  readonly recentAssignmentConflict?: string;
}

export function buildAssignmentCommitEnvelope(
  input: BuildAssignmentCommitEnvelopeInput
): AssignmentCommitEnvelope {
  return commitAssignmentWithAuthorization(input);
}

export interface OrderPublishEnvelope extends PublishOrderResult {
  readonly order: Order;
  readonly auditEvent: AuditEvent;
}

export interface BuildOrderPublishEnvelopeInput {
  readonly order: Order;
  readonly actorUserId: string;
  readonly auditEventId: string;
  readonly publishedAt: string;
}

export function buildOrderPublishEnvelope(
  input: BuildOrderPublishEnvelopeInput
): OrderPublishEnvelope {
  return publishOrder(input);
}

export interface AttendanceApprovalEnvelope {
  readonly assignment: Assignment;
  readonly attendance: Attendance;
  readonly auditEvent: AuditEvent;
  readonly invoiceDraftRequest: InvoiceDraftRequest;
  readonly outboxJob: OutboxJob;
}

export interface BuildAttendanceApprovalEnvelopeInput {
  readonly assignment: Assignment;
  readonly attendance: Attendance;
  readonly approverUserId: string;
  readonly approvedAt: string;
  readonly auditEventId: string;
  readonly outboxJobId: string;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
}

export function buildAttendanceApprovalEnvelope(
  input: BuildAttendanceApprovalEnvelopeInput
): AttendanceApprovalEnvelope {
  const approval = approveAttendance({
    assignment: input.assignment,
    attendance: input.attendance,
    approverUserId: input.approverUserId,
    approvedAt: input.approvedAt,
    auditEventId: input.auditEventId,
    billingPeriodStart: input.billingPeriodStart,
    billingPeriodEnd: input.billingPeriodEnd
  });

  const outboxJob = createInvoiceDraftOutboxJob({
    jobId: input.outboxJobId,
    request: approval.invoiceDraftRequest,
    scheduledAt: input.approvedAt
  });

  return {
    assignment: input.assignment,
    attendance: approval.attendance,
    auditEvent: approval.auditEvent,
    invoiceDraftRequest: approval.invoiceDraftRequest,
    outboxJob
  };
}

export interface FinanceHandoffExportEnvelope extends BillingHandoffExportAuthorizationResult {
  readonly exportArtifact: BillingHandoffExportArtifact;
  readonly auditEvent: AuditEvent;
  readonly outboxJob: OutboxJob;
}

export interface BuildFinanceHandoffExportEnvelopeInput {
  readonly exportBatchId: string;
  readonly auditEventId: string;
  readonly outboxJobId: string;
  readonly generatedAt: string;
  readonly generatedByUserId: string;
  readonly actorRole: OperatorRole;
  readonly authorizationAuditEventId: string;
  readonly lines: readonly BillingHandoffExportLineInput[];
}

export function buildFinanceHandoffExportEnvelope(
  input: BuildFinanceHandoffExportEnvelopeInput
): FinanceHandoffExportEnvelope {
  const exportResult = generateBillingHandoffExportWithAuthorization({
    exportBatchId: input.exportBatchId,
    auditEventId: input.auditEventId,
    generatedAt: input.generatedAt,
    generatedByUserId: input.generatedByUserId,
    actorRole: input.actorRole,
    authorizationAuditEventId: input.authorizationAuditEventId,
    lines: input.lines
  });

  const outboxJob = createBillingHandoffExportOutboxJob({
    jobId: input.outboxJobId,
    artifact: exportResult.exportArtifact,
    scheduledAt: input.generatedAt
  });

  return {
    authorizationAuditEvent: exportResult.authorizationAuditEvent,
    exportArtifact: exportResult.exportArtifact,
    auditEvent: exportResult.auditEvent,
    outboxJob
  };
}

export type AttendanceSubmissionEnvelope = AttendanceSubmissionResult;

export type BuildAttendanceSubmissionEnvelopeInput = SubmitAttendanceInput;

export function buildAttendanceSubmissionEnvelope(
  input: BuildAttendanceSubmissionEnvelopeInput
): AttendanceSubmissionEnvelope {
  return submitAttendance(input);
}

export type AttendanceCorrectionEnvelope = AttendanceCorrectionAuthorizationResult;

export interface BuildAttendanceCorrectionEnvelopeInput extends CorrectAttendanceInput {
  readonly actorRole: OperatorRole;
  readonly authorizationAuditEventId: string;
}

export function buildAttendanceCorrectionEnvelope(
  input: BuildAttendanceCorrectionEnvelopeInput
): AttendanceCorrectionEnvelope {
  return correctAttendanceWithAuthorization(input);
}

export type { CreateAssignmentInput, CreateOrderInput };
export {
  buildDesignPartnerPilotProofBundle,
  designPartnerPilotFixtureId,
  designPartnerPilotProofBundle,
  type AllowedRoleBoundaryProof,
  type ApprovedAttendanceProof,
  type BillingHandoffBatchRecordShape,
  type BlockedAttendanceProof,
  type CorrectedReapprovalProof,
  type DeniedRoleBoundaryProof,
  type DesignPartnerPilotProofBundle,
  type MobileRetryRecoveryProof,
  type PilotProofTrace,
  type RoleBoundaryProofBundle
} from "./pilot-proof.js";

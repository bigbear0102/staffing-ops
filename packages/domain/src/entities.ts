import type { CoreModule } from "./modules.js";

export type ServiceType = "dispatch" | "subcontracting" | "outsourcing";
export type ContractStatus = "draft" | "active" | "suspended" | "terminated";
export type QualificationStatus = "pending" | "qualified" | "restricted" | "inactive";
export type DocumentReadiness = "ready" | "missing" | "expired";
export type AvailabilityStatus = "available" | "unavailable";
export type OperatorRole =
  | "admin"
  | "operations_manager"
  | "operations_operator"
  | "finance_admin"
  | "site_lead"
  | "viewer";
export type OrderStatus =
  | "draft"
  | "open"
  | "partially_filled"
  | "filled"
  | "closed"
  | "cancelled";
export type AssignmentStatus =
  | "proposed"
  | "confirmed"
  | "active"
  | "completed"
  | "replaced"
  | "cancelled";
export type AttendanceStatus =
  | "captured"
  | "submitted"
  | "approved"
  | "rejected"
  | "corrected";
export type AttendanceSource = "operator_entry" | "site_lead_mobile" | "import";
export type AuditEntityType =
  | "client_account"
  | "site"
  | "order"
  | "worker"
  | "assignment"
  | "attendance"
  | "billing_handoff_batch"
  | "document_file"
  | "outbox_job";
export type OutboxJobStatus = "pending" | "processing" | "completed" | "failed";
export type OutboxJobTopic =
  | "billing.invoice_draft.requested"
  | "billing.invoice_handoff.exported"
  | "compliance.artifact_expiry.reminder"
  | "documents.file_processed";
export type BillingExportFormat = "csv";
export type TaxTreatmentCode = "vatable_standard" | "zero_rated" | "exempt";

export interface BaseRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BillingProfile {
  readonly contactName: string;
  readonly contactEmail: string;
  readonly invoicingTermsDays: number;
  readonly paymentMethod: "bank_transfer" | "card" | "cash";
}

export interface ClientAccount extends BaseRecord {
  readonly legalName: string;
  readonly businessRegistrationNumber: string;
  readonly contractStatus: ContractStatus;
  readonly ownerUserId: string;
  readonly defaultBillingProfile: BillingProfile;
}

export interface Site extends BaseRecord {
  readonly clientAccountId: string;
  readonly name: string;
  readonly addressLine1: string;
  readonly managerName: string;
  readonly managerPhone: string;
  readonly requiredQualifications: readonly string[];
  readonly operatingCalendarCode: string;
}

export interface Order extends BaseRecord {
  readonly clientAccountId: string;
  readonly siteId: string;
  readonly roleCode: string;
  readonly headcountRequired: number;
  readonly requiredQualifications: readonly string[];
  readonly slotsFilled: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly shiftPattern: string;
  readonly billRateKrw: number;
  readonly overtimeRuleCode: string;
  readonly status: OrderStatus;
}

export interface Worker extends BaseRecord {
  readonly legalName: string;
  readonly phoneE164: string;
  readonly residencyStatus: string;
  readonly skillTags: readonly string[];
  readonly heldQualifications: readonly string[];
  readonly qualificationStatus: QualificationStatus;
  readonly documentReadiness: DocumentReadiness;
  readonly availabilityStatus: AvailabilityStatus;
  readonly availabilityDetail: string;
  readonly payrollReference: string;
  readonly active: boolean;
}

export type WorkerEligibilityBlockerCode =
  | "qualification_not_ready"
  | "missing_qualification"
  | "document_not_ready"
  | "worker_unavailable"
  | "recent_assignment_conflict";

export interface WorkerEligibilityBlocker {
  readonly code: WorkerEligibilityBlockerCode;
  readonly detail: string;
}

export interface WorkerEligibilityCheck {
  readonly eligible: boolean;
  readonly overrideRequired: boolean;
  readonly requiredQualifications: readonly string[];
  readonly missingQualifications: readonly string[];
  readonly documentReadiness: DocumentReadiness;
  readonly availabilityStatus: AvailabilityStatus;
  readonly recentAssignmentConflict?: string;
  readonly blockers: readonly WorkerEligibilityBlocker[];
}

export interface AssignmentSnapshotInput {
  readonly orderId: string;
  readonly workerId: string;
  readonly siteId: string;
  readonly payRateKrw: number;
  readonly billRateKrw: number;
  readonly shiftPattern: string;
  readonly effectiveDate: string;
  readonly serviceType: ServiceType;
}

export interface AssignmentSnapshot extends AssignmentSnapshotInput {
  readonly snapshotVersion: 1;
}

export interface Assignment extends BaseRecord {
  readonly clientAccountId: string;
  readonly orderId: string;
  readonly workerId: string;
  readonly siteId: string;
  readonly plannedStartDate: string;
  readonly plannedEndDate: string;
  readonly sourceChannel: string;
  readonly status: AssignmentStatus;
  readonly snapshot: AssignmentSnapshot;
}

export interface Attendance extends BaseRecord {
  readonly assignmentId: string;
  readonly workDate: string;
  readonly scheduledStartAt: string;
  readonly scheduledEndAt: string;
  readonly actualStartAt?: string;
  readonly actualEndAt?: string;
  readonly breakMinutes: number;
  readonly overtimeMinutes: number;
  readonly status: AttendanceStatus;
  readonly source: AttendanceSource;
  readonly exceptionCode?: string;
  readonly approvedAt?: string;
  readonly approvedByUserId?: string;
}

export interface DocumentFile extends BaseRecord {
  readonly storageKey: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly checksumSha256: string;
  readonly immutableVersion: number;
}

export interface AuditEvent {
  readonly id: string;
  readonly organizationId: string;
  readonly module: CoreModule;
  readonly entityType: AuditEntityType;
  readonly entityId: string;
  readonly action: string;
  readonly actorUserId: string;
  readonly occurredAt: string;
  readonly payload: Record<string, unknown>;
}

export interface CreateOutboxJobInput {
  readonly id: string;
  readonly organizationId: string;
  readonly topic: OutboxJobTopic;
  readonly dedupeKey: string;
  readonly payload: Record<string, unknown>;
  readonly scheduledAt: string;
  readonly maxAttempts?: number;
}

export interface OutboxJob {
  readonly id: string;
  readonly organizationId: string;
  readonly topic: OutboxJobTopic;
  readonly status: OutboxJobStatus;
  readonly dedupeKey: string;
  readonly payload: Record<string, unknown>;
  readonly scheduledAt: string;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly lastError?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface InvoiceDraftRequest {
  readonly organizationId: string;
  readonly clientAccountId: string;
  readonly siteId: string;
  readonly workerId: string;
  readonly sourceAssignmentId: string;
  readonly sourceAttendanceId: string;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
  readonly billRateKrw: number;
  readonly requestedAt: string;
}

export interface BillingHandoffAssignmentSnapshot {
  readonly assignmentId: string;
  readonly orderId: string;
  readonly workerId: string;
  readonly siteId: string;
  readonly snapshot: AssignmentSnapshot;
}

export interface BillingHandoffExportRow {
  readonly exportBatchId: string;
  readonly batchKey: string;
  readonly lineNumber: number;
  readonly clientAccountId: string;
  readonly siteId: string;
  readonly orderId: string;
  readonly assignmentId: string;
  readonly workerId: string;
  readonly attendanceId: string;
  readonly workDate: string;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
  readonly actualStartAt: string;
  readonly actualEndAt: string;
  readonly breakMinutes: number;
  readonly overtimeMinutes: number;
  readonly billableMinutes: number;
  readonly billableHours: number;
  readonly billRateKrw: number;
  readonly billAmountKrw: number;
  readonly taxTreatmentCode: TaxTreatmentCode;
  readonly attendanceSource: AttendanceSource;
  readonly supportingAttendanceEvidence: readonly string[];
  readonly disputeNote?: string;
  readonly requestedAt: string;
  readonly generatedAt: string;
  readonly generatedByUserId: string;
}

export interface BillingHandoffExportArtifact {
  readonly exportBatchId: string;
  readonly organizationId: string;
  readonly batchKey: string;
  readonly clientAccountId: string;
  readonly siteId: string;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
  readonly generatedAt: string;
  readonly generatedByUserId: string;
  readonly format: BillingExportFormat;
  readonly columns: readonly string[];
  readonly rows: readonly BillingHandoffExportRow[];
  readonly csvContent: string;
  readonly sourceAttendanceIds: readonly string[];
  readonly sourceAssignmentSnapshots: readonly BillingHandoffAssignmentSnapshot[];
}

export interface AttendanceSubmissionResult {
  readonly attendance: Attendance;
  readonly auditEvent: AuditEvent;
}

export interface AttendanceCorrectionResult {
  readonly attendance: Attendance;
  readonly auditEvent: AuditEvent;
}

export interface AttendanceApprovalResult {
  readonly attendance: Attendance;
  readonly auditEvent: AuditEvent;
  readonly invoiceDraftRequest: InvoiceDraftRequest;
}

export interface BillingHandoffExportResult {
  readonly exportArtifact: BillingHandoffExportArtifact;
  readonly auditEvent: AuditEvent;
}

export interface AssignmentCommitResult {
  readonly order: Order;
  readonly assignment: Assignment;
  readonly auditEvent: AuditEvent;
  readonly eligibility: WorkerEligibilityCheck;
}

import {
  type BillingHandoffExportArtifact,
  createOutboxJob,
  type InvoiceDraftRequest,
  type OutboxJob,
  type OutboxJobTopic
} from "@staffing-ops/domain";

export const supportedJobTopics = [
  "billing.invoice_draft.requested",
  "billing.invoice_handoff.exported",
  "compliance.artifact_expiry.reminder",
  "documents.file_processed"
] as const satisfies readonly OutboxJobTopic[];

export const jobQueueManifest = {
  package: "@staffing-ops/jobs",
  driver: "postgres-outbox",
  defaultMaxAttempts: 10,
  idempotencyScope: "organizationId+dedupeKey",
  supportedTopics: [...supportedJobTopics]
} as const;

export interface CreateInvoiceDraftOutboxJobInput {
  readonly jobId: string;
  readonly request: InvoiceDraftRequest;
  readonly scheduledAt: string;
  readonly maxAttempts?: number;
}

export function createInvoiceDraftOutboxJob(
  input: CreateInvoiceDraftOutboxJobInput
): OutboxJob {
  return createOutboxJob({
    id: input.jobId,
    organizationId: input.request.organizationId,
    topic: "billing.invoice_draft.requested",
    dedupeKey: `invoice-draft:${input.request.sourceAttendanceId}`,
    payload: { ...input.request },
    scheduledAt: input.scheduledAt,
    maxAttempts: input.maxAttempts ?? jobQueueManifest.defaultMaxAttempts
  });
}

export interface CreateBillingHandoffExportOutboxJobInput {
  readonly jobId: string;
  readonly artifact: BillingHandoffExportArtifact;
  readonly scheduledAt: string;
  readonly maxAttempts?: number;
}

export function createBillingHandoffExportOutboxJob(
  input: CreateBillingHandoffExportOutboxJobInput
): OutboxJob {
  return createOutboxJob({
    id: input.jobId,
    organizationId: input.artifact.organizationId,
    topic: "billing.invoice_handoff.exported",
    dedupeKey: input.artifact.batchKey,
    payload: {
      exportBatchId: input.artifact.exportBatchId,
      batchKey: input.artifact.batchKey,
      generatedAt: input.artifact.generatedAt,
      generatedByUserId: input.artifact.generatedByUserId,
      format: input.artifact.format,
      rowCount: input.artifact.rows.length,
      sourceAttendanceIds: [...input.artifact.sourceAttendanceIds],
      sourceAssignmentSnapshots: [...input.artifact.sourceAssignmentSnapshots],
      rows: [...input.artifact.rows],
      csvContent: input.artifact.csvContent
    },
    scheduledAt: input.scheduledAt,
    maxAttempts: input.maxAttempts ?? jobQueueManifest.defaultMaxAttempts
  });
}

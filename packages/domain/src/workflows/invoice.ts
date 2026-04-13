import type {
  Assignment,
  Attendance,
  AuditEvent,
  BillingHandoffAssignmentSnapshot,
  BillingHandoffExportArtifact,
  BillingHandoffExportResult,
  BillingHandoffExportRow,
  InvoiceDraftRequest,
  OperatorRole,
  TaxTreatmentCode
} from "../entities.js";
import { authorizeRoleBoundary } from "../authorization.js";
import { createAuditEvent } from "../records.js";

export interface CreateInvoiceDraftRequestInput {
  readonly assignment: Assignment;
  readonly attendance: Attendance;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
  readonly requestedAt: string;
}

export function createInvoiceDraftRequest(
  input: CreateInvoiceDraftRequestInput
): InvoiceDraftRequest {
  if (input.attendance.status !== "approved") {
    throw new Error("Only approved attendance can generate invoice draft requests.");
  }

  if (input.billingPeriodEnd < input.billingPeriodStart) {
    throw new Error("Invoice billing period end must be on or after the start.");
  }

  return {
    organizationId: input.assignment.organizationId,
    clientAccountId: input.assignment.clientAccountId,
    siteId: input.assignment.siteId,
    workerId: input.assignment.workerId,
    sourceAssignmentId: input.assignment.id,
    sourceAttendanceId: input.attendance.id,
    billingPeriodStart: input.billingPeriodStart,
    billingPeriodEnd: input.billingPeriodEnd,
    billRateKrw: input.assignment.snapshot.billRateKrw,
    requestedAt: input.requestedAt
  };
}

export interface BillingHandoffExportLineInput {
  readonly invoiceDraftRequest: InvoiceDraftRequest;
  readonly assignment: Assignment;
  readonly attendance: Attendance;
  readonly taxTreatmentCode?: TaxTreatmentCode;
  readonly supportingAttendanceEvidence?: readonly string[];
  readonly disputeNote?: string;
}

export interface GenerateBillingHandoffExportInput {
  readonly exportBatchId: string;
  readonly auditEventId: string;
  readonly generatedAt: string;
  readonly generatedByUserId: string;
  readonly lines: readonly BillingHandoffExportLineInput[];
}

export interface GenerateBillingHandoffExportWithAuthorizationInput
  extends GenerateBillingHandoffExportInput {
  readonly actorRole: OperatorRole;
  readonly authorizationAuditEventId: string;
}

export interface BillingHandoffExportAuthorizationResult extends BillingHandoffExportResult {
  readonly authorizationAuditEvent: AuditEvent;
}

const billingHandoffExportColumns = [
  "exportBatchId",
  "batchKey",
  "lineNumber",
  "clientAccountId",
  "siteId",
  "orderId",
  "assignmentId",
  "workerId",
  "attendanceId",
  "workDate",
  "billingPeriodStart",
  "billingPeriodEnd",
  "actualStartAt",
  "actualEndAt",
  "breakMinutes",
  "overtimeMinutes",
  "billableMinutes",
  "billableHours",
  "billRateKrw",
  "billAmountKrw",
  "taxTreatmentCode",
  "attendanceSource",
  "supportingAttendanceEvidence",
  "disputeNote",
  "requestedAt",
  "generatedAt",
  "generatedByUserId"
] as const;

function ensureApprovedExportLine(line: BillingHandoffExportLineInput): void {
  if (line.attendance.status !== "approved") {
    throw new Error("Only approved attendance can generate finance handoff exports.");
  }

  if (!line.attendance.actualStartAt || !line.attendance.actualEndAt) {
    throw new Error("Finance handoff exports require approved attendance actual times.");
  }

  if (line.attendance.assignmentId !== line.assignment.id) {
    throw new Error("Finance handoff exports require matching assignment and attendance records.");
  }

  if (line.invoiceDraftRequest.sourceAssignmentId !== line.assignment.id) {
    throw new Error("Finance handoff exports require invoice requests to reference the source assignment.");
  }

  if (line.invoiceDraftRequest.sourceAttendanceId !== line.attendance.id) {
    throw new Error("Finance handoff exports require invoice requests to reference the source attendance.");
  }
}

function getBillableMinutes(attendance: Attendance): number {
  if (!attendance.actualStartAt || !attendance.actualEndAt) {
    throw new Error("Finance handoff exports require approved attendance actual times.");
  }

  const workedMinutes = Math.round(
    (Date.parse(attendance.actualEndAt) - Date.parse(attendance.actualStartAt)) / 60000
  );
  const billableMinutes = workedMinutes - attendance.breakMinutes;

  if (billableMinutes < 0) {
    throw new Error("Finance handoff exports cannot produce negative billable minutes.");
  }

  return billableMinutes;
}

function escapeCsvValue(value: string | number | undefined): string {
  if (value === undefined) {
    return "";
  }

  const serialized = String(value);

  if (!serialized.includes(",") && !serialized.includes("\"") && !serialized.includes("\n")) {
    return serialized;
  }

  return `"${serialized.replaceAll("\"", "\"\"")}"`;
}

function buildCsvContent(rows: readonly BillingHandoffExportRow[]): string {
  const header = billingHandoffExportColumns.join(",");
  const lines = rows.map((row) =>
    [
      row.exportBatchId,
      row.batchKey,
      row.lineNumber,
      row.clientAccountId,
      row.siteId,
      row.orderId,
      row.assignmentId,
      row.workerId,
      row.attendanceId,
      row.workDate,
      row.billingPeriodStart,
      row.billingPeriodEnd,
      row.actualStartAt,
      row.actualEndAt,
      row.breakMinutes,
      row.overtimeMinutes,
      row.billableMinutes,
      row.billableHours,
      row.billRateKrw,
      row.billAmountKrw,
      row.taxTreatmentCode,
      row.attendanceSource,
      row.supportingAttendanceEvidence.join("|"),
      row.disputeNote,
      row.requestedAt,
      row.generatedAt,
      row.generatedByUserId
    ].map((value) => escapeCsvValue(value)).join(",")
  );

  return [header, ...lines].join("\n");
}

export function generateBillingHandoffExport(
  input: GenerateBillingHandoffExportInput
): BillingHandoffExportResult {
  const firstLine = input.lines[0];

  if (!firstLine) {
    throw new Error("Finance handoff exports require at least one approved line.");
  }

  const remainingLines = input.lines.slice(1);
  ensureApprovedExportLine(firstLine);

  const batchKey = `billing-handoff:${input.exportBatchId}`;

  for (const line of remainingLines) {
    ensureApprovedExportLine(line);

    if (
      line.invoiceDraftRequest.organizationId !== firstLine.invoiceDraftRequest.organizationId
      || line.invoiceDraftRequest.clientAccountId !== firstLine.invoiceDraftRequest.clientAccountId
      || line.invoiceDraftRequest.siteId !== firstLine.invoiceDraftRequest.siteId
      || line.invoiceDraftRequest.billingPeriodStart !== firstLine.invoiceDraftRequest.billingPeriodStart
      || line.invoiceDraftRequest.billingPeriodEnd !== firstLine.invoiceDraftRequest.billingPeriodEnd
    ) {
      throw new Error(
        "Finance handoff export batches must stay within one organization, client, site, and billing period."
      );
    }
  }

  const rows = input.lines.map((line, index) => {
    const billableMinutes = getBillableMinutes(line.attendance);
    const billableHours = Number((billableMinutes / 60).toFixed(2));
    const billAmountKrw = Math.round((line.invoiceDraftRequest.billRateKrw * billableMinutes) / 60);

    return {
      exportBatchId: input.exportBatchId,
      batchKey,
      lineNumber: index + 1,
      clientAccountId: line.invoiceDraftRequest.clientAccountId,
      siteId: line.invoiceDraftRequest.siteId,
      orderId: line.assignment.orderId,
      assignmentId: line.assignment.id,
      workerId: line.assignment.workerId,
      attendanceId: line.attendance.id,
      workDate: line.attendance.workDate,
      billingPeriodStart: line.invoiceDraftRequest.billingPeriodStart,
      billingPeriodEnd: line.invoiceDraftRequest.billingPeriodEnd,
      actualStartAt: line.attendance.actualStartAt!,
      actualEndAt: line.attendance.actualEndAt!,
      breakMinutes: line.attendance.breakMinutes,
      overtimeMinutes: line.attendance.overtimeMinutes,
      billableMinutes,
      billableHours,
      billRateKrw: line.invoiceDraftRequest.billRateKrw,
      billAmountKrw,
      taxTreatmentCode: line.taxTreatmentCode ?? "vatable_standard",
      attendanceSource: line.attendance.source,
      supportingAttendanceEvidence: [...(line.supportingAttendanceEvidence ?? [])],
      ...(line.disputeNote ? { disputeNote: line.disputeNote } : {}),
      requestedAt: line.invoiceDraftRequest.requestedAt,
      generatedAt: input.generatedAt,
      generatedByUserId: input.generatedByUserId
    } satisfies BillingHandoffExportRow;
  });

  const sourceAssignmentSnapshots = Array.from(
    new Map(
      input.lines.map((line) => [
        line.assignment.id,
        {
          assignmentId: line.assignment.id,
          orderId: line.assignment.orderId,
          workerId: line.assignment.workerId,
          siteId: line.assignment.siteId,
          snapshot: line.assignment.snapshot
        } satisfies BillingHandoffAssignmentSnapshot
      ])
    ).values()
  );

  const sourceAttendanceIds = rows.map((row) => row.attendanceId);
  const exportArtifact: BillingHandoffExportArtifact = {
    exportBatchId: input.exportBatchId,
    organizationId: firstLine.invoiceDraftRequest.organizationId,
    batchKey,
    clientAccountId: firstLine.invoiceDraftRequest.clientAccountId,
    siteId: firstLine.invoiceDraftRequest.siteId,
    billingPeriodStart: firstLine.invoiceDraftRequest.billingPeriodStart,
    billingPeriodEnd: firstLine.invoiceDraftRequest.billingPeriodEnd,
    generatedAt: input.generatedAt,
    generatedByUserId: input.generatedByUserId,
    format: "csv",
    columns: [...billingHandoffExportColumns],
    rows,
    csvContent: buildCsvContent(rows),
    sourceAttendanceIds,
    sourceAssignmentSnapshots
  };

  return {
    exportArtifact,
    auditEvent: createAuditEvent({
      id: input.auditEventId,
      organizationId: exportArtifact.organizationId,
      module: "billing",
      entityType: "billing_handoff_batch",
      entityId: input.exportBatchId,
      actorUserId: input.generatedByUserId,
      action: "billing.finance_handoff_exported",
      occurredAt: input.generatedAt,
      payload: {
        batchKey,
        exportFormat: exportArtifact.format,
        clientAccountId: exportArtifact.clientAccountId,
        siteId: exportArtifact.siteId,
        billingPeriodStart: exportArtifact.billingPeriodStart,
        billingPeriodEnd: exportArtifact.billingPeriodEnd,
        rowCount: rows.length,
        sourceAttendanceIds,
        sourceAssignmentIds: sourceAssignmentSnapshots.map((snapshot) => snapshot.assignmentId)
      }
    })
  };
}

export function generateBillingHandoffExportWithAuthorization(
  input: GenerateBillingHandoffExportWithAuthorizationInput
): BillingHandoffExportAuthorizationResult {
  const firstLine = input.lines[0];

  if (!firstLine) {
    throw new Error("Finance handoff exports require at least one approved line.");
  }

  const authorizationAuditEvent = authorizeRoleBoundary({
    organizationId: firstLine.invoiceDraftRequest.organizationId,
    action: "billing_export",
    actor: {
      userId: input.generatedByUserId,
      role: input.actorRole
    },
    auditEventId: input.authorizationAuditEventId,
    occurredAt: input.generatedAt,
    entityType: "billing_handoff_batch",
    entityId: input.exportBatchId,
    context: {
      clientAccountId: firstLine.invoiceDraftRequest.clientAccountId,
      siteId: firstLine.invoiceDraftRequest.siteId,
      lineCount: input.lines.length,
      sourceAttendanceIds: input.lines.map((line) => line.attendance.id)
    }
  });
  const result = generateBillingHandoffExport(input);

  return {
    ...result,
    authorizationAuditEvent
  };
}

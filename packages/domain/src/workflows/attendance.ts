import type {
  Attendance,
  AttendanceApprovalResult,
  AttendanceCorrectionResult,
  AttendanceSubmissionResult,
  Assignment,
  AuditEvent,
  OperatorRole
} from "../entities.js";
import { authorizeRoleBoundary } from "../authorization.js";
import { createAuditEvent } from "../records.js";
import { createInvoiceDraftRequest } from "./invoice.js";

function ensureActualTimes(attendance: Attendance, action: "submission" | "correction" | "approval"): void {
  if (!attendance.actualStartAt || !attendance.actualEndAt) {
    throw new Error(`Attendance ${action} requires actual start and end times.`);
  }

  if (Date.parse(attendance.actualEndAt) < Date.parse(attendance.actualStartAt)) {
    throw new Error("Attendance actual end time must be on or after the actual start time.");
  }
}

function ensureNonNegativeMinutes(attendance: Attendance): void {
  if (attendance.breakMinutes < 0) {
    throw new Error("Attendance break minutes cannot be negative.");
  }

  if (attendance.overtimeMinutes < 0) {
    throw new Error("Attendance overtime minutes cannot be negative.");
  }
}

export interface SubmitAttendanceInput {
  readonly attendance: Attendance;
  readonly submittedByUserId: string;
  readonly submittedAt: string;
  readonly auditEventId: string;
}

export function submitAttendance(input: SubmitAttendanceInput): AttendanceSubmissionResult {
  if (input.attendance.status !== "captured") {
    throw new Error("Only captured attendance can be submitted.");
  }

  ensureActualTimes(input.attendance, "submission");
  ensureNonNegativeMinutes(input.attendance);

  const attendance: Attendance = {
    ...input.attendance,
    status: "submitted",
    updatedAt: input.submittedAt
  };

  return {
    attendance,
    auditEvent: createAuditEvent({
      id: input.auditEventId,
      organizationId: input.attendance.organizationId,
      module: "attendance",
      entityType: "attendance",
      entityId: attendance.id,
      actorUserId: input.submittedByUserId,
      action: "attendance.submitted",
      occurredAt: input.submittedAt,
      payload: {
        workDate: attendance.workDate,
        source: attendance.source,
        actualStartAt: attendance.actualStartAt,
        actualEndAt: attendance.actualEndAt,
        breakMinutes: attendance.breakMinutes,
        overtimeMinutes: attendance.overtimeMinutes
      }
    })
  };
}

export interface CorrectAttendanceInput {
  readonly attendance: Attendance;
  readonly correctedByUserId: string;
  readonly correctedAt: string;
  readonly auditEventId: string;
  readonly correctionReason: string;
  readonly actualStartAt?: string;
  readonly actualEndAt?: string;
  readonly breakMinutes?: number;
  readonly overtimeMinutes?: number;
  readonly exceptionCode?: string;
}

export interface CorrectAttendanceWithAuthorizationInput extends CorrectAttendanceInput {
  readonly actorRole: OperatorRole;
  readonly authorizationAuditEventId: string;
}

export interface AttendanceCorrectionAuthorizationResult extends AttendanceCorrectionResult {
  readonly authorizationAuditEvent: AuditEvent;
}

export function correctAttendance(input: CorrectAttendanceInput): AttendanceCorrectionResult {
  if (
    input.attendance.status !== "submitted"
    && input.attendance.status !== "approved"
    && input.attendance.status !== "rejected"
  ) {
    throw new Error("Only submitted, approved, or rejected attendance can be corrected.");
  }

  if (!input.correctionReason.trim()) {
    throw new Error("Attendance correction requires a reason.");
  }

  const {
    approvedAt: previousApprovedAt,
    approvedByUserId: previousApprovedByUserId,
    ...attendanceBase
  } = input.attendance;
  void previousApprovedAt;
  void previousApprovedByUserId;

  const attendance: Attendance = {
    ...attendanceBase,
    ...(input.actualStartAt ? { actualStartAt: input.actualStartAt } : {}),
    ...(input.actualEndAt ? { actualEndAt: input.actualEndAt } : {}),
    ...(input.breakMinutes !== undefined ? { breakMinutes: input.breakMinutes } : {}),
    ...(input.overtimeMinutes !== undefined ? { overtimeMinutes: input.overtimeMinutes } : {}),
    ...(input.exceptionCode !== undefined ? { exceptionCode: input.exceptionCode } : {}),
    status: "corrected",
    updatedAt: input.correctedAt
  };

  ensureActualTimes(attendance, "correction");
  ensureNonNegativeMinutes(attendance);

  return {
    attendance,
    auditEvent: createAuditEvent({
      id: input.auditEventId,
      organizationId: input.attendance.organizationId,
      module: "attendance",
      entityType: "attendance",
      entityId: attendance.id,
      actorUserId: input.correctedByUserId,
      action: "attendance.corrected",
      occurredAt: input.correctedAt,
      payload: {
        correctionReason: input.correctionReason,
        before: {
          status: input.attendance.status,
          actualStartAt: input.attendance.actualStartAt ?? null,
          actualEndAt: input.attendance.actualEndAt ?? null,
          breakMinutes: input.attendance.breakMinutes,
          overtimeMinutes: input.attendance.overtimeMinutes,
          exceptionCode: input.attendance.exceptionCode ?? null,
          approvedAt: input.attendance.approvedAt ?? null,
          approvedByUserId: input.attendance.approvedByUserId ?? null
        },
        after: {
          status: attendance.status,
          actualStartAt: attendance.actualStartAt,
          actualEndAt: attendance.actualEndAt,
          breakMinutes: attendance.breakMinutes,
          overtimeMinutes: attendance.overtimeMinutes,
          exceptionCode: attendance.exceptionCode ?? null,
          approvedAt: attendance.approvedAt ?? null,
          approvedByUserId: attendance.approvedByUserId ?? null
        }
      }
    })
  };
}

export function correctAttendanceWithAuthorization(
  input: CorrectAttendanceWithAuthorizationInput
): AttendanceCorrectionAuthorizationResult {
  const authorizationAuditEvent = authorizeRoleBoundary({
    organizationId: input.attendance.organizationId,
    action: "attendance_correction",
    actor: {
      userId: input.correctedByUserId,
      role: input.actorRole
    },
    auditEventId: input.authorizationAuditEventId,
    occurredAt: input.correctedAt,
    entityType: "attendance",
    entityId: input.attendance.id,
    context: {
      assignmentId: input.attendance.assignmentId,
      previousStatus: input.attendance.status,
      correctionReason: input.correctionReason
    }
  });
  const result = correctAttendance(input);

  return {
    ...result,
    authorizationAuditEvent
  };
}

export interface ApproveAttendanceInput {
  readonly assignment: Assignment;
  readonly attendance: Attendance;
  readonly approverUserId: string;
  readonly approvedAt: string;
  readonly auditEventId: string;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
}

export function approveAttendance(input: ApproveAttendanceInput): AttendanceApprovalResult {
  if (input.attendance.assignmentId !== input.assignment.id) {
    throw new Error("Attendance must belong to the assignment being approved.");
  }

  if (input.attendance.status !== "submitted" && input.attendance.status !== "corrected") {
    throw new Error("Only submitted or corrected attendance can be approved.");
  }

  ensureActualTimes(input.attendance, "approval");
  ensureNonNegativeMinutes(input.attendance);

  const attendance: Attendance = {
    ...input.attendance,
    status: "approved",
    approvedAt: input.approvedAt,
    approvedByUserId: input.approverUserId,
    updatedAt: input.approvedAt
  };

  const auditEvent = createAuditEvent({
    id: input.auditEventId,
    organizationId: input.assignment.organizationId,
    module: "attendance",
    entityType: "attendance",
    entityId: attendance.id,
    actorUserId: input.approverUserId,
    action: "attendance.approved",
    occurredAt: input.approvedAt,
    payload: {
      assignmentId: input.assignment.id,
      previousStatus: input.attendance.status,
      workDate: attendance.workDate,
      billingPeriodStart: input.billingPeriodStart,
      billingPeriodEnd: input.billingPeriodEnd
    }
  });

  return {
    attendance,
    auditEvent,
    invoiceDraftRequest: createInvoiceDraftRequest({
      assignment: input.assignment,
      attendance,
      billingPeriodStart: input.billingPeriodStart,
      billingPeriodEnd: input.billingPeriodEnd,
      requestedAt: input.approvedAt
    })
  };
}

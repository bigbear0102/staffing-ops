import { describe, expect, it } from "vitest";

import {
  buildDesignPartnerPilotProofBundle,
  designPartnerPilotFixtureId
} from "../../apps/api/src/index.ts";

describe("design partner pilot proof bundle", () => {
  it("freezes one named fixture for order-to-export trace reconstruction", () => {
    const proof = buildDesignPartnerPilotProofBundle();

    expect(proof.fixtureId).toBe(designPartnerPilotFixtureId);
    expect(proof.environmentName).toBe("pilot-reviewable-proof");
    expect(proof.timezone).toBe("Asia/Seoul");
    expect(proof.trace.orderId).toBe(proof.order.published.id);
    expect(proof.trace.exportBatchId).toBe(proof.billing.exportArtifact.exportBatchId);
    expect(proof.trace.exportBatchKey).toBe(proof.billing.exportArtifact.batchKey);
    expect(proof.persistedRows.orders).toEqual([proof.order.published]);
    expect(proof.persistedRows.billingHandoffBatch.artifactPayload.exportBatchId).toBe(
      proof.trace.exportBatchId
    );
  });

  it("keeps override, correction, and final finance handoff proof on the same dataset", () => {
    const proof = buildDesignPartnerPilotProofBundle();

    expect(proof.assignments.readyPath.order.status).toBe("partially_filled");
    expect(proof.assignments.overridePath.order.status).toBe("filled");
    expect(proof.permissions.placementOverride.allowed.authorizationAuditEvent.action).toBe(
      "placement.override_authorized"
    );
    expect(proof.assignments.overridePath.auditEvent.payload).toMatchObject({
      overrideReason:
        "Operations manager approved temporary deployment while missing compliance evidence is collected."
    });

    expect(proof.attendance.cleanApproved.approval.auditEvent.action).toBe("attendance.approved");
    expect(proof.permissions.attendanceCorrection.allowed.authorizationAuditEvent.action).toBe(
      "attendance.correction_authorized"
    );
    expect(proof.attendance.correctedReapproved.correction.auditEvent.action).toBe(
      "attendance.corrected"
    );
    expect(proof.attendance.correctedReapproved.reapproval.auditEvent.payload).toMatchObject({
      previousStatus: "corrected"
    });
    expect(proof.attendance.correctedReapproved.reapprovalInvoiceOutboxJob.dedupeKey).toBe(
      `invoice-draft:${proof.attendance.correctedReapproved.attendance.id}`
    );

    expect(proof.billing.exportAuditEvent.action).toBe("billing.finance_handoff_exported");
    expect(proof.permissions.billingExport.allowed.authorizationAuditEvent.action).toBe(
      "billing.finance_handoff_export_authorized"
    );
    expect(proof.billing.exportOutboxJob.payload).toMatchObject({
      exportBatchId: proof.trace.exportBatchId,
      batchKey: proof.trace.exportBatchKey
    });
  });

  it("exports approved rows only and preserves blocked attendance as excluded proof", () => {
    const proof = buildDesignPartnerPilotProofBundle();
    const blockedAttendanceId = proof.attendance.blockedUnapproved.attendance.id;

    expect(proof.billing.exportArtifact.sourceAttendanceIds).toEqual(
      proof.trace.approvedAttendanceIds
    );
    expect(proof.billing.exportArtifact.sourceAttendanceIds).toEqual([
      proof.attendance.cleanApproved.attendance.id,
      proof.attendance.correctedReapproved.attendance.id
    ]);
    expect(proof.billing.exportArtifact.sourceAttendanceIds).not.toContain(blockedAttendanceId);
    expect(proof.billing.excludedAttendanceIds).toEqual([blockedAttendanceId]);
    expect(proof.trace.excludedAttendanceIds).toEqual([blockedAttendanceId]);
    expect(proof.archivePayload.trace.excludedAttendanceIds).toEqual([blockedAttendanceId]);

    expect(proof.billing.exportArtifact.rows).toHaveLength(2);
    expect(proof.billing.exportArtifact.rows.map((row) => row.assignmentId)).toEqual(
      proof.trace.assignmentIds
    );
    expect(proof.persistedRows.attendance.map((attendance) => attendance.id)).toContain(
      blockedAttendanceId
    );
    expect(proof.billing.exportArtifact.csvContent).toContain(proof.trace.exportBatchId);
    expect(proof.billing.exportArtifact.csvContent).not.toContain(blockedAttendanceId);
  });

  it("archives denied role-boundary audit proof for operator and site-lead actions", () => {
    const proof = buildDesignPartnerPilotProofBundle();

    expect(proof.permissions.placementOverride.denied).toMatchObject({
      actorRole: "operations_operator",
      denialAuditEvent: {
        action: "placement.override_denied",
        payload: {
          decision: "denied"
        }
      }
    });
    expect(proof.permissions.attendanceCorrection.denied).toMatchObject({
      actorRole: "site_lead",
      denialAuditEvent: {
        action: "attendance.correction_denied",
        payload: {
          decision: "denied"
        }
      }
    });
    expect(proof.permissions.billingExport.denied).toMatchObject({
      actorRole: "site_lead",
      denialAuditEvent: {
        action: "billing.finance_handoff_export_denied",
        payload: {
          decision: "denied"
        }
      }
    });
    expect(proof.operatorRolesUsed).toEqual(
      expect.arrayContaining(["admin", "operations_operator", "finance_admin", "site_lead"])
    );
  });

  it("keeps mobile retry and evidence recovery pinned to one attendance id without duplicate submit drift", () => {
    const proof = buildDesignPartnerPilotProofBundle();
    const blockedAttendanceId = proof.attendance.blockedUnapproved.attendance.id;

    expect(proof.mobileRecovery.pendingAttendanceId).toBe(blockedAttendanceId);
    expect(proof.mobileRecovery.selectedRecordId).toBe(blockedAttendanceId);
    expect(proof.mobileRecovery.firstAttempt.queueStatus).toBe("pending_sync");
    expect(proof.mobileRecovery.duplicateSubmissionGuard.dedupeKey).toBe(
      proof.mobileRecovery.submissionDedupeKey
    );
    expect(proof.mobileRecovery.duplicateSubmissionGuard.attemptedAttendanceIds).toEqual([
      blockedAttendanceId,
      blockedAttendanceId
    ]);
    expect(proof.mobileRecovery.duplicateSubmissionGuard.resultingAttendanceIds).toEqual([
      blockedAttendanceId
    ]);
    expect(proof.mobileRecovery.duplicateSubmissionGuard.duplicatePrevented).toBe(true);
    expect(proof.mobileRecovery.evidenceUploadRecovery.preservedSelectedRecordId).toBe(
      blockedAttendanceId
    );
    expect(proof.mobileRecovery.desktopConvergence.attendanceId).toBe(blockedAttendanceId);
    expect(proof.mobileRecovery.desktopConvergence.excludedFromExportBatch).toBe(true);
    expect(proof.mobileRecovery.desktopConvergence.exportSourceAttendanceIds).toEqual(
      proof.trace.approvedAttendanceIds
    );
  });
});

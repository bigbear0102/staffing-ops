import { describe, expect, it } from "vitest";

import {
  approveAttendance,
  buildQueueSummaryCards,
  canRolePerformAction,
  commitAssignment,
  commitAssignmentWithAuthorization,
  correctAttendance,
  correctAttendanceWithAuthorization,
  createAssignment,
  createAssignmentSnapshot,
  createOrder,
  evaluateWorkerEligibility,
  generateBillingHandoffExport,
  generateBillingHandoffExportWithAuthorization,
  publishOrder,
  RoleBoundaryAuthorizationError,
  submitAttendance
} from "../src/index.js";

describe("createAssignmentSnapshot", () => {
  it("freezes assignment billing and payroll inputs into a versioned snapshot", () => {
    expect(
      createAssignmentSnapshot({
        orderId: "order-1",
        workerId: "worker-1",
        siteId: "site-1",
        payRateKrw: 12000,
        billRateKrw: 18000,
        shiftPattern: "weekday-day",
        effectiveDate: "2026-04-07",
        serviceType: "dispatch"
      })
    ).toMatchObject({
      snapshotVersion: 1,
      billRateKrw: 18000
    });
  });

  it("rejects non-positive rates so invoice math cannot start from invalid data", () => {
    expect(() =>
      createAssignmentSnapshot({
        orderId: "order-1",
        workerId: "worker-1",
        siteId: "site-1",
        payRateKrw: 0,
        billRateKrw: 18000,
        shiftPattern: "weekday-day",
        effectiveDate: "2026-04-07",
        serviceType: "dispatch"
      })
    ).toThrow("Pay rate must be positive.");
  });
});

describe("order intake workflow", () => {
  it("publishes a draft order into staffing-ready open state with audit context", () => {
    const draftOrder = createOrder({
      id: "order-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      siteId: "site-1",
      roleCode: "warehouse-picker",
      headcountRequired: 2,
      requiredQualifications: ["forklift"],
      startDate: "2026-04-08",
      endDate: "2026-04-30",
      shiftPattern: "weekday-day",
      billRateKrw: 19000,
      overtimeRuleCode: "std-kr",
      createdAt: "2026-04-07T08:00:00+09:00"
    });

    const published = publishOrder({
      order: draftOrder,
      actorUserId: "operator-1",
      auditEventId: "audit-order-1",
      publishedAt: "2026-04-07T08:10:00+09:00"
    });

    expect(published.order.status).toBe("open");
    expect(published.order.slotsFilled).toBe(0);
    expect(published.auditEvent.action).toBe("order.published");
  });

  it("blocks publish when the order has no qualification gate defined", () => {
    const draftOrder = createOrder({
      id: "order-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      siteId: "site-1",
      roleCode: "warehouse-picker",
      headcountRequired: 1,
      requiredQualifications: [],
      startDate: "2026-04-08",
      endDate: "2026-04-30",
      shiftPattern: "weekday-day",
      billRateKrw: 19000,
      overtimeRuleCode: "std-kr",
      createdAt: "2026-04-07T08:00:00+09:00"
    });

    expect(() =>
      publishOrder({
        order: draftOrder,
        actorUserId: "operator-1",
        auditEventId: "audit-order-1",
        publishedAt: "2026-04-07T08:10:00+09:00"
      })
    ).toThrow("Orders must declare at least one required qualification before publish.");
  });
});

describe("role boundary authorization", () => {
  it("defines clear allow and deny rules for override, correction, and export actions", () => {
    expect(canRolePerformAction("admin", "placement_override")).toBe(true);
    expect(canRolePerformAction("operations_manager", "placement_override")).toBe(true);
    expect(canRolePerformAction("operations_operator", "placement_override")).toBe(false);
    expect(canRolePerformAction("site_lead", "placement_override")).toBe(false);
    expect(canRolePerformAction("finance_admin", "placement_override")).toBe(false);

    expect(canRolePerformAction("admin", "attendance_correction")).toBe(true);
    expect(canRolePerformAction("operations_manager", "attendance_correction")).toBe(true);
    expect(canRolePerformAction("operations_operator", "attendance_correction")).toBe(true);
    expect(canRolePerformAction("site_lead", "attendance_correction")).toBe(false);
    expect(canRolePerformAction("finance_admin", "attendance_correction")).toBe(false);

    expect(canRolePerformAction("admin", "billing_export")).toBe(true);
    expect(canRolePerformAction("operations_manager", "billing_export")).toBe(true);
    expect(canRolePerformAction("finance_admin", "billing_export")).toBe(true);
    expect(canRolePerformAction("operations_operator", "billing_export")).toBe(false);
    expect(canRolePerformAction("site_lead", "billing_export")).toBe(false);
  });
});

describe("assignment commit workflow", () => {
  const publishedOrder = publishOrder({
    order: createOrder({
      id: "order-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      siteId: "site-1",
      roleCode: "warehouse-picker",
      headcountRequired: 2,
      requiredQualifications: ["forklift", "night-shift"],
      startDate: "2026-04-08",
      endDate: "2026-04-30",
      shiftPattern: "weekday-night",
      billRateKrw: 19000,
      overtimeRuleCode: "std-kr",
      createdAt: "2026-04-07T08:00:00+09:00"
    }),
    actorUserId: "operator-1",
    auditEventId: "audit-order-1",
    publishedAt: "2026-04-07T08:10:00+09:00"
  }).order;

  it("summarizes the worker eligibility blockers that can stop placement", () => {
    const eligibility = evaluateWorkerEligibility({
      order: publishedOrder,
      worker: {
        id: "worker-1",
        organizationId: "org-1",
        legalName: "Kim Worker",
        phoneE164: "+821012341234",
        residencyStatus: "citizen",
        skillTags: ["warehouse"],
        heldQualifications: ["forklift"],
        qualificationStatus: "pending",
        documentReadiness: "missing",
        availabilityStatus: "unavailable",
        availabilityDetail: "Already booked on another site",
        payrollReference: "PAY-001",
        active: true,
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      },
      recentAssignmentConflict: "Worker already confirmed on 2026-04-08 at Site B."
    });

    expect(eligibility.eligible).toBe(false);
    expect(eligibility.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "qualification_not_ready" }),
        expect.objectContaining({ code: "missing_qualification" }),
        expect.objectContaining({ code: "document_not_ready" }),
        expect.objectContaining({ code: "worker_unavailable" }),
        expect.objectContaining({ code: "recent_assignment_conflict" })
      ])
    );
  });

  it("blocks assignment commit until an override reason is provided for ineligible workers", () => {
    expect(() =>
      commitAssignment({
        assignmentId: "assignment-1",
        order: publishedOrder,
        worker: {
          id: "worker-1",
          organizationId: "org-1",
          legalName: "Kim Worker",
          phoneE164: "+821012341234",
          residencyStatus: "citizen",
          skillTags: ["warehouse"],
          heldQualifications: ["forklift"],
          qualificationStatus: "qualified",
          documentReadiness: "missing",
          availabilityStatus: "available",
          availabilityDetail: "Available after 18:00",
          payrollReference: "PAY-001",
          active: true,
          createdAt: "2026-04-07T08:00:00+09:00",
          updatedAt: "2026-04-07T08:00:00+09:00"
        },
        actorUserId: "operator-1",
        auditEventId: "audit-assignment-1",
        committedAt: "2026-04-07T08:20:00+09:00",
        sourceChannel: "operator_console",
        payRateKrw: 13000,
        serviceType: "dispatch",
        effectiveDate: "2026-04-08"
      })
    ).toThrow("Assignment commit requires override:");
  });

  it("records a denied audit event when a non-manager attempts a placement override", () => {
    let denial: unknown;

    try {
      commitAssignmentWithAuthorization({
        assignmentId: "assignment-unauthorized-1",
        order: publishedOrder,
        worker: {
          id: "worker-1",
          organizationId: "org-1",
          legalName: "Kim Worker",
          phoneE164: "+821012341234",
          residencyStatus: "citizen",
          skillTags: ["warehouse"],
          heldQualifications: ["forklift"],
          qualificationStatus: "qualified",
          documentReadiness: "missing",
          availabilityStatus: "available",
          availabilityDetail: "Available after 18:00",
          payrollReference: "PAY-001",
          active: true,
          createdAt: "2026-04-07T08:00:00+09:00",
          updatedAt: "2026-04-07T08:00:00+09:00"
        },
        actorUserId: "operator-1",
        actorRole: "operations_operator",
        auditEventId: "audit-assignment-1",
        authorizationAuditEventId: "audit-assignment-auth-1",
        committedAt: "2026-04-07T08:20:00+09:00",
        sourceChannel: "operator_console",
        payRateKrw: 13000,
        serviceType: "dispatch",
        effectiveDate: "2026-04-08",
        overrideReason: "Operator attempted document override without escalation."
      });
    } catch (error) {
      denial = error;
    }

    expect(denial).toBeInstanceOf(RoleBoundaryAuthorizationError);
    expect((denial as RoleBoundaryAuthorizationError).auditEvent).toMatchObject({
      action: "placement.override_denied",
      actorUserId: "operator-1",
      payload: {
        actorRole: "operations_operator",
        decision: "denied",
        allowedRoles: ["admin", "operations_manager"]
      }
    });
  });

  it("commits an assignment, snapshots terms, and advances order fill state with override audit data", () => {
    const result = commitAssignment({
      assignmentId: "assignment-1",
      order: publishedOrder,
      worker: {
        id: "worker-1",
        organizationId: "org-1",
        legalName: "Kim Worker",
        phoneE164: "+821012341234",
        residencyStatus: "citizen",
        skillTags: ["warehouse"],
        heldQualifications: ["forklift", "night-shift"],
        qualificationStatus: "qualified",
        documentReadiness: "expired",
        availabilityStatus: "available",
        availabilityDetail: "Available after 18:00",
        payrollReference: "PAY-001",
        active: true,
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      },
      actorUserId: "operator-1",
      auditEventId: "audit-assignment-1",
      committedAt: "2026-04-07T08:20:00+09:00",
      sourceChannel: "operator_console",
      payRateKrw: 13000,
      serviceType: "dispatch",
      effectiveDate: "2026-04-08",
      overrideReason: "Client approved temporary document expiry override until renewal is uploaded."
    });

    expect(result.assignment.status).toBe("confirmed");
    expect(result.order.status).toBe("partially_filled");
    expect(result.order.slotsFilled).toBe(1);
    expect(result.auditEvent.action).toBe("assignment.committed");
    expect(result.auditEvent.payload).toMatchObject({
      overrideReason: "Client approved temporary document expiry override until renewal is uploaded."
    });
  });

  it("records authorization before allowing an admin placement override", () => {
    const result = commitAssignmentWithAuthorization({
      assignmentId: "assignment-authorized-1",
      order: publishedOrder,
      worker: {
        id: "worker-1",
        organizationId: "org-1",
        legalName: "Kim Worker",
        phoneE164: "+821012341234",
        residencyStatus: "citizen",
        skillTags: ["warehouse"],
        heldQualifications: ["forklift", "night-shift"],
        qualificationStatus: "qualified",
        documentReadiness: "expired",
        availabilityStatus: "available",
        availabilityDetail: "Available after 18:00",
        payrollReference: "PAY-001",
        active: true,
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      },
      actorUserId: "admin-1",
      actorRole: "admin",
      auditEventId: "audit-assignment-1",
      authorizationAuditEventId: "audit-assignment-auth-1",
      committedAt: "2026-04-07T08:20:00+09:00",
      sourceChannel: "operator_console",
      payRateKrw: 13000,
      serviceType: "dispatch",
      effectiveDate: "2026-04-08",
      overrideReason: "Admin approved temporary document expiry override until renewal is uploaded."
    });

    expect(result.authorizationAuditEvent).toMatchObject({
      action: "placement.override_authorized",
      actorUserId: "admin-1",
      payload: {
        actorRole: "admin",
        decision: "authorized"
      }
    });
    expect(result.auditEvent.action).toBe("assignment.committed");
  });
});

describe("attendance approval workflow", () => {
  it("submits captured attendance into the approvable queue with an audit event", () => {
    const result = submitAttendance({
      attendance: {
        id: "attendance-1",
        organizationId: "org-1",
        assignmentId: "assignment-1",
        workDate: "2026-04-07",
        scheduledStartAt: "2026-04-07T09:00:00+09:00",
        scheduledEndAt: "2026-04-07T18:00:00+09:00",
        actualStartAt: "2026-04-07T09:02:00+09:00",
        actualEndAt: "2026-04-07T18:01:00+09:00",
        breakMinutes: 60,
        overtimeMinutes: 1,
        status: "captured",
        source: "site_lead_mobile",
        createdAt: "2026-04-07T18:00:00+09:00",
        updatedAt: "2026-04-07T18:00:00+09:00"
      },
      submittedByUserId: "site-lead-1",
      submittedAt: "2026-04-07T18:05:00+09:00",
      auditEventId: "audit-submit-1"
    });

    expect(result.attendance.status).toBe("submitted");
    expect(result.auditEvent.action).toBe("attendance.submitted");
  });

  it("turns a submitted attendance row into an auditable invoice draft trigger", () => {
    const assignment = createAssignment({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-1",
      siteId: "site-1",
      payRateKrw: 12000,
      billRateKrw: 18000,
      shiftPattern: "weekday-day",
      effectiveDate: "2026-04-07",
      serviceType: "dispatch",
      plannedStartDate: "2026-04-07",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      createdAt: "2026-04-07T08:00:00+09:00"
    });

    const result = approveAttendance({
      assignment,
      attendance: {
        id: "attendance-1",
        organizationId: "org-1",
        assignmentId: assignment.id,
        workDate: "2026-04-07",
        scheduledStartAt: "2026-04-07T09:00:00+09:00",
        scheduledEndAt: "2026-04-07T18:00:00+09:00",
        actualStartAt: "2026-04-07T09:02:00+09:00",
        actualEndAt: "2026-04-07T18:34:00+09:00",
        breakMinutes: 60,
        overtimeMinutes: 32,
        status: "submitted",
        source: "site_lead_mobile",
        createdAt: "2026-04-07T18:05:00+09:00",
        updatedAt: "2026-04-07T18:05:00+09:00"
      },
      approverUserId: "operator-1",
      approvedAt: "2026-04-07T18:40:00+09:00",
      auditEventId: "audit-1",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30"
    });

    expect(result.attendance.status).toBe("approved");
    expect(result.auditEvent.action).toBe("attendance.approved");
    expect(result.invoiceDraftRequest).toMatchObject({
      clientAccountId: "client-1",
      sourceAttendanceId: "attendance-1",
      billRateKrw: 18000
    });
  });

  it("keeps a correction and re-approval trail before triggering finance handoff again", () => {
    const assignment = createAssignment({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-1",
      siteId: "site-1",
      payRateKrw: 12000,
      billRateKrw: 18000,
      shiftPattern: "weekday-day",
      effectiveDate: "2026-04-07",
      serviceType: "dispatch",
      plannedStartDate: "2026-04-07",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      createdAt: "2026-04-07T08:00:00+09:00"
    });

    const correction = correctAttendance({
      attendance: {
        id: "attendance-1",
        organizationId: "org-1",
        assignmentId: assignment.id,
        workDate: "2026-04-07",
        scheduledStartAt: "2026-04-07T09:00:00+09:00",
        scheduledEndAt: "2026-04-07T18:00:00+09:00",
        actualStartAt: "2026-04-07T09:02:00+09:00",
        actualEndAt: "2026-04-07T18:20:00+09:00",
        breakMinutes: 60,
        overtimeMinutes: 20,
        status: "approved",
        source: "site_lead_mobile",
        approvedAt: "2026-04-07T18:30:00+09:00",
        approvedByUserId: "operator-1",
        createdAt: "2026-04-07T18:05:00+09:00",
        updatedAt: "2026-04-07T18:30:00+09:00"
      },
      correctedByUserId: "operator-2",
      correctedAt: "2026-04-08T09:00:00+09:00",
      auditEventId: "audit-correct-1",
      correctionReason: "Retro overtime adjustment after shift lead evidence review.",
      actualEndAt: "2026-04-07T18:34:00+09:00",
      overtimeMinutes: 34
    });

    const reapproved = approveAttendance({
      assignment,
      attendance: correction.attendance,
      approverUserId: "operator-3",
      approvedAt: "2026-04-08T09:10:00+09:00",
      auditEventId: "audit-approve-2",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30"
    });

    expect(correction.attendance.status).toBe("corrected");
    expect(correction.auditEvent.action).toBe("attendance.corrected");
    expect(correction.auditEvent.payload).toMatchObject({
      correctionReason: "Retro overtime adjustment after shift lead evidence review.",
      before: {
        status: "approved"
      },
      after: {
        status: "corrected",
        overtimeMinutes: 34
      }
    });
    expect(reapproved.attendance.status).toBe("approved");
    expect(reapproved.auditEvent.payload).toMatchObject({
      previousStatus: "corrected"
    });
    expect(reapproved.invoiceDraftRequest.sourceAttendanceId).toBe("attendance-1");
  });

  it("records authorization when an operator corrects attendance and denies site-lead changes", () => {
    const approvedAttendance = {
      id: "attendance-1",
      organizationId: "org-1",
      assignmentId: "assignment-1",
      workDate: "2026-04-07",
      scheduledStartAt: "2026-04-07T09:00:00+09:00",
      scheduledEndAt: "2026-04-07T18:00:00+09:00",
      actualStartAt: "2026-04-07T09:02:00+09:00",
      actualEndAt: "2026-04-07T18:20:00+09:00",
      breakMinutes: 60,
      overtimeMinutes: 20,
      status: "approved" as const,
      source: "site_lead_mobile" as const,
      approvedAt: "2026-04-07T18:30:00+09:00",
      approvedByUserId: "operator-1",
      createdAt: "2026-04-07T18:05:00+09:00",
      updatedAt: "2026-04-07T18:30:00+09:00"
    };

    const correction = correctAttendanceWithAuthorization({
      attendance: approvedAttendance,
      correctedByUserId: "operator-2",
      actorRole: "operations_operator",
      correctedAt: "2026-04-08T09:00:00+09:00",
      auditEventId: "audit-correct-1",
      authorizationAuditEventId: "audit-correct-auth-1",
      correctionReason: "Retro overtime adjustment after shift lead evidence review.",
      actualEndAt: "2026-04-07T18:34:00+09:00",
      overtimeMinutes: 34
    });

    expect(correction.authorizationAuditEvent).toMatchObject({
      action: "attendance.correction_authorized",
      actorUserId: "operator-2",
      payload: {
        actorRole: "operations_operator",
        decision: "authorized"
      }
    });

    let denial: unknown;

    try {
      correctAttendanceWithAuthorization({
        attendance: approvedAttendance,
        correctedByUserId: "site-lead-1",
        actorRole: "site_lead",
        correctedAt: "2026-04-08T09:00:00+09:00",
        auditEventId: "audit-correct-denied-1",
        authorizationAuditEventId: "audit-correct-auth-denied-1",
        correctionReason: "Site lead attempted direct edit.",
        actualEndAt: "2026-04-07T18:34:00+09:00",
        overtimeMinutes: 34
      });
    } catch (error) {
      denial = error;
    }

    expect(denial).toBeInstanceOf(RoleBoundaryAuthorizationError);
    expect((denial as RoleBoundaryAuthorizationError).auditEvent).toMatchObject({
      action: "attendance.correction_denied",
      actorUserId: "site-lead-1",
      payload: {
        actorRole: "site_lead",
        decision: "denied"
      }
    });
  });

  it("rejects attendance approvals when the row is not ready for finance handoff", () => {
    const assignment = createAssignment({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-1",
      siteId: "site-1",
      payRateKrw: 12000,
      billRateKrw: 18000,
      shiftPattern: "weekday-day",
      effectiveDate: "2026-04-07",
      serviceType: "dispatch",
      plannedStartDate: "2026-04-07",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      createdAt: "2026-04-07T08:00:00+09:00"
    });

    expect(() =>
      approveAttendance({
        assignment,
        attendance: {
          id: "attendance-1",
          organizationId: "org-1",
          assignmentId: assignment.id,
          workDate: "2026-04-07",
          scheduledStartAt: "2026-04-07T09:00:00+09:00",
          scheduledEndAt: "2026-04-07T18:00:00+09:00",
          breakMinutes: 60,
          overtimeMinutes: 0,
          status: "captured",
          source: "operator_entry",
          createdAt: "2026-04-07T18:05:00+09:00",
          updatedAt: "2026-04-07T18:05:00+09:00"
        },
        approverUserId: "operator-1",
        approvedAt: "2026-04-07T18:40:00+09:00",
        auditEventId: "audit-1",
        billingPeriodStart: "2026-04-01",
        billingPeriodEnd: "2026-04-30"
      })
    ).toThrow("Only submitted or corrected attendance can be approved.");
  });
});

describe("billing handoff export workflow", () => {
  it("freezes approved invoice handoff rows into a reviewable spreadsheet artifact", () => {
    const assignment = createAssignment({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-1",
      siteId: "site-1",
      payRateKrw: 12000,
      billRateKrw: 18000,
      shiftPattern: "weekday-day",
      effectiveDate: "2026-04-07",
      serviceType: "dispatch",
      plannedStartDate: "2026-04-07",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      createdAt: "2026-04-07T08:00:00+09:00"
    });
    const approval = approveAttendance({
      assignment,
      attendance: {
        id: "attendance-1",
        organizationId: "org-1",
        assignmentId: assignment.id,
        workDate: "2026-04-07",
        scheduledStartAt: "2026-04-07T09:00:00+09:00",
        scheduledEndAt: "2026-04-07T18:00:00+09:00",
        actualStartAt: "2026-04-07T09:02:00+09:00",
        actualEndAt: "2026-04-07T18:34:00+09:00",
        breakMinutes: 60,
        overtimeMinutes: 32,
        status: "submitted",
        source: "site_lead_mobile",
        createdAt: "2026-04-07T18:05:00+09:00",
        updatedAt: "2026-04-07T18:05:00+09:00"
      },
      approverUserId: "operator-1",
      approvedAt: "2026-04-07T18:40:00+09:00",
      auditEventId: "audit-approve-1",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30"
    });

    const result = generateBillingHandoffExport({
      exportBatchId: "batch-1",
      auditEventId: "audit-export-1",
      generatedAt: "2026-04-08T09:00:00+09:00",
      generatedByUserId: "finance-1",
      lines: [
        {
          invoiceDraftRequest: approval.invoiceDraftRequest,
          assignment,
          attendance: approval.attendance,
          supportingAttendanceEvidence: ["kakao://evidence/attendance-1"]
        }
      ]
    });

    expect(result.exportArtifact.batchKey).toBe("billing-handoff:batch-1");
    expect(result.exportArtifact.sourceAttendanceIds).toEqual(["attendance-1"]);
    expect(result.exportArtifact.sourceAssignmentSnapshots).toEqual([
      expect.objectContaining({
        assignmentId: "assignment-1",
        snapshot: expect.objectContaining({
          snapshotVersion: 1,
          billRateKrw: 18000
        })
      })
    ]);
    expect(result.exportArtifact.rows).toEqual([
      expect.objectContaining({
        exportBatchId: "batch-1",
        batchKey: "billing-handoff:batch-1",
        attendanceId: "attendance-1",
        assignmentId: "assignment-1",
        billableMinutes: 512,
        billAmountKrw: 153600,
        generatedByUserId: "finance-1"
      })
    ]);
    expect(result.exportArtifact.csvContent).toContain("billing-handoff:batch-1");
    expect(result.auditEvent).toMatchObject({
      action: "billing.finance_handoff_exported",
      entityType: "billing_handoff_batch",
      entityId: "batch-1",
      payload: {
        batchKey: "billing-handoff:batch-1",
        rowCount: 1,
        sourceAttendanceIds: ["attendance-1"],
        sourceAssignmentIds: ["assignment-1"]
      }
    });
  });

  it("records export authorization for finance and denies site-lead exports", () => {
    const assignment = createAssignment({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-1",
      siteId: "site-1",
      payRateKrw: 12000,
      billRateKrw: 18000,
      shiftPattern: "weekday-day",
      effectiveDate: "2026-04-07",
      serviceType: "dispatch",
      plannedStartDate: "2026-04-07",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      createdAt: "2026-04-07T08:00:00+09:00"
    });
    const approval = approveAttendance({
      assignment,
      attendance: {
        id: "attendance-1",
        organizationId: "org-1",
        assignmentId: assignment.id,
        workDate: "2026-04-07",
        scheduledStartAt: "2026-04-07T09:00:00+09:00",
        scheduledEndAt: "2026-04-07T18:00:00+09:00",
        actualStartAt: "2026-04-07T09:02:00+09:00",
        actualEndAt: "2026-04-07T18:34:00+09:00",
        breakMinutes: 60,
        overtimeMinutes: 32,
        status: "submitted",
        source: "site_lead_mobile",
        createdAt: "2026-04-07T18:05:00+09:00",
        updatedAt: "2026-04-07T18:05:00+09:00"
      },
      approverUserId: "operator-1",
      approvedAt: "2026-04-07T18:40:00+09:00",
      auditEventId: "audit-approve-1",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30"
    });

    const exportResult = generateBillingHandoffExportWithAuthorization({
      exportBatchId: "batch-1",
      auditEventId: "audit-export-1",
      authorizationAuditEventId: "audit-export-auth-1",
      generatedAt: "2026-04-08T09:00:00+09:00",
      generatedByUserId: "finance-1",
      actorRole: "finance_admin",
      lines: [
        {
          invoiceDraftRequest: approval.invoiceDraftRequest,
          assignment,
          attendance: approval.attendance
        }
      ]
    });

    expect(exportResult.authorizationAuditEvent).toMatchObject({
      action: "billing.finance_handoff_export_authorized",
      actorUserId: "finance-1",
      payload: {
        actorRole: "finance_admin",
        decision: "authorized"
      }
    });

    let denial: unknown;

    try {
      generateBillingHandoffExportWithAuthorization({
        exportBatchId: "batch-2",
        auditEventId: "audit-export-denied-1",
        authorizationAuditEventId: "audit-export-auth-denied-1",
        generatedAt: "2026-04-08T09:05:00+09:00",
        generatedByUserId: "site-lead-1",
        actorRole: "site_lead",
        lines: [
          {
            invoiceDraftRequest: approval.invoiceDraftRequest,
            assignment,
            attendance: approval.attendance
          }
        ]
      });
    } catch (error) {
      denial = error;
    }

    expect(denial).toBeInstanceOf(RoleBoundaryAuthorizationError);
    expect((denial as RoleBoundaryAuthorizationError).auditEvent).toMatchObject({
      action: "billing.finance_handoff_export_denied",
      actorUserId: "site-lead-1",
      payload: {
        actorRole: "site_lead",
        decision: "denied"
      }
    });
  });

  it("rejects finance handoff export generation when the attendance is not approved", () => {
    const assignment = createAssignment({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-1",
      siteId: "site-1",
      payRateKrw: 12000,
      billRateKrw: 18000,
      shiftPattern: "weekday-day",
      effectiveDate: "2026-04-07",
      serviceType: "dispatch",
      plannedStartDate: "2026-04-07",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      createdAt: "2026-04-07T08:00:00+09:00"
    });

    expect(() =>
      generateBillingHandoffExport({
        exportBatchId: "batch-1",
        auditEventId: "audit-export-1",
        generatedAt: "2026-04-08T09:00:00+09:00",
        generatedByUserId: "finance-1",
        lines: [
          {
            invoiceDraftRequest: {
              organizationId: "org-1",
              clientAccountId: "client-1",
              siteId: "site-1",
              workerId: "worker-1",
              sourceAssignmentId: "assignment-1",
              sourceAttendanceId: "attendance-1",
              billingPeriodStart: "2026-04-01",
              billingPeriodEnd: "2026-04-30",
              billRateKrw: 18000,
              requestedAt: "2026-04-07T18:40:00+09:00"
            },
            assignment,
            attendance: {
              id: "attendance-1",
              organizationId: "org-1",
              assignmentId: "assignment-1",
              workDate: "2026-04-07",
              scheduledStartAt: "2026-04-07T09:00:00+09:00",
              scheduledEndAt: "2026-04-07T18:00:00+09:00",
              actualStartAt: "2026-04-07T09:02:00+09:00",
              actualEndAt: "2026-04-07T18:34:00+09:00",
              breakMinutes: 60,
              overtimeMinutes: 32,
              status: "corrected",
              source: "site_lead_mobile",
              createdAt: "2026-04-07T18:05:00+09:00",
              updatedAt: "2026-04-08T09:00:00+09:00"
            }
          }
        ]
      })
    ).toThrow("Only approved attendance can generate finance handoff exports.");
  });
});

describe("operator queue summary cards", () => {
  it("summarizes the seeded operator dataset into visible workload counts", () => {
    expect(buildQueueSummaryCards()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Attendance exceptions",
          value: 2
        }),
        expect.objectContaining({
          label: "Invoice blockers",
          value: 2
        })
      ])
    );
  });
});

import { describe, expect, it } from "vitest";

import {
  buildAttendanceSubmissionEnvelope,
  handleAttendanceApproval,
  handleBillingHandoffRequest,
  handleOrderIntake,
  handlePlacementCommit,
  type JsonApiResponse
} from "../../apps/api/src/index.ts";
import { createInMemoryStaffingPersistence } from "../../packages/db/src/index.ts";

function createSeededRepository() {
  const repository = createInMemoryStaffingPersistence();

  repository.seed({
    organizations: [
      {
        id: "org-1",
        name: "Design Partner Ops",
        countryCode: "KR",
        timezone: "Asia/Seoul",
        currencyCode: "KRW",
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      }
    ],
    operatorUsers: [
      {
        id: "ops-manager-1",
        organizationId: "org-1",
        email: "ops-manager@example.com",
        displayName: "Ops Manager",
        role: "operations_manager",
        active: true,
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      },
      {
        id: "ops-operator-1",
        organizationId: "org-1",
        email: "ops-operator@example.com",
        displayName: "Ops Operator",
        role: "operations_operator",
        active: true,
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      },
      {
        id: "finance-admin-1",
        organizationId: "org-1",
        email: "finance@example.com",
        displayName: "Finance Admin",
        role: "finance_admin",
        active: true,
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      },
      {
        id: "site-lead-1",
        organizationId: "org-1",
        email: "site-lead@example.com",
        displayName: "Site Lead",
        role: "site_lead",
        active: true,
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      }
    ],
    clientAccounts: [
      {
        id: "client-1",
        organizationId: "org-1",
        legalName: "Cold Chain Customer",
        businessRegistrationNumber: "123-45-67890",
        contractStatus: "active",
        ownerUserId: "ops-manager-1",
        defaultBillingProfile: {
          contactName: "Finance Lead",
          contactEmail: "finance@example.com",
          invoicingTermsDays: 30,
          paymentMethod: "bank_transfer"
        },
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      }
    ],
    sites: [
      {
        id: "site-1",
        organizationId: "org-1",
        clientAccountId: "client-1",
        name: "Gimpo Center",
        addressLine1: "123 Warehouse Road",
        managerName: "Kim Lead",
        managerPhone: "010-1234-5678",
        requiredQualifications: ["forklift"],
        operatingCalendarCode: "weekday-day",
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      }
    ],
    workers: [
      {
        id: "worker-ready-1",
        organizationId: "org-1",
        legalName: "Ready Worker",
        phoneE164: "+821012345678",
        residencyStatus: "citizen",
        skillTags: ["warehouse"],
        heldQualifications: ["forklift"],
        qualificationStatus: "qualified",
        documentReadiness: "ready",
        availabilityStatus: "available",
        availabilityDetail: "available",
        payrollReference: "PAY-READY",
        active: true,
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      },
      {
        id: "worker-blocked-1",
        organizationId: "org-1",
        legalName: "Blocked Worker",
        phoneE164: "+821012345679",
        residencyStatus: "citizen",
        skillTags: ["warehouse"],
        heldQualifications: ["forklift"],
        qualificationStatus: "qualified",
        documentReadiness: "missing",
        availabilityStatus: "available",
        availabilityDetail: "available",
        payrollReference: "PAY-BLOCKED",
        active: true,
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      }
    ]
  });

  return repository;
}

function expectSuccess<T>(response: JsonApiResponse<T>): T {
  expect(response.status).toBeLessThan(300);
  return response.body as T;
}

describe("backend thin slice persistence", () => {
  it("persists order -> placement -> attendance approval -> billing handoff with audit and outbox traces", () => {
    const repository = createSeededRepository();

    const orderResponse = handleOrderIntake(repository, {
      orderId: "order-1",
      actorUserId: "ops-manager-1",
      createdAt: "2026-04-07T08:10:00+09:00",
      publish: {
        auditEventId: "audit-order-publish-1",
        publishedAt: "2026-04-07T08:11:00+09:00"
      },
      payload: {
        organizationId: "org-1",
        clientAccountId: "client-1",
        siteId: "site-1",
        roleCode: "picker",
        headcountRequired: 1,
        requiredQualifications: ["forklift"],
        startDate: "2026-04-08",
        endDate: "2026-04-30",
        shiftPattern: "weekday-day",
        billRateKrw: 19000,
        overtimeRuleCode: "std-kr"
      }
    });

    const order = expectSuccess(orderResponse).order;
    expect(order.status).toBe("open");

    const placementResponse = handlePlacementCommit(repository, {
      assignmentId: "assignment-1",
      orderId: "order-1",
      workerId: "worker-ready-1",
      actorUserId: "ops-manager-1",
      actorRole: "operations_manager",
      auditEventId: "audit-assignment-commit-1",
      committedAt: "2026-04-07T08:20:00+09:00",
      sourceChannel: "operator_console",
      payRateKrw: 13000,
      serviceType: "dispatch",
      effectiveDate: "2026-04-08"
    });

    const placement = expectSuccess(placementResponse);
    expect(placement.assignmentStatus).toBe("confirmed");

    const submitted = buildAttendanceSubmissionEnvelope({
      attendance: {
        id: "attendance-1",
        organizationId: "org-1",
        assignmentId: "assignment-1",
        workDate: "2026-04-08",
        scheduledStartAt: "2026-04-08T09:00:00+09:00",
        scheduledEndAt: "2026-04-08T18:00:00+09:00",
        actualStartAt: "2026-04-08T09:01:00+09:00",
        actualEndAt: "2026-04-08T18:15:00+09:00",
        breakMinutes: 60,
        overtimeMinutes: 15,
        status: "captured",
        source: "site_lead_mobile",
        createdAt: "2026-04-08T18:00:00+09:00",
        updatedAt: "2026-04-08T18:00:00+09:00"
      },
      submittedByUserId: "site-lead-1",
      submittedAt: "2026-04-08T18:16:00+09:00",
      auditEventId: "audit-attendance-submit-1"
    });

    repository.putAttendance(submitted.attendance);
    repository.appendAuditEvent(submitted.auditEvent);

    const approvalResponse = handleAttendanceApproval(repository, {
      assignmentId: "assignment-1",
      attendanceId: "attendance-1",
      billingHandoffRequestId: "handoff-request-1",
      approverUserId: "ops-manager-1",
      approvedAt: "2026-04-08T18:30:00+09:00",
      auditEventId: "audit-attendance-approve-1",
      outboxJobId: "job-invoice-draft-1",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30"
    });

    const approval = expectSuccess(approvalResponse);
    expect(approval.billingHandoffRequest.status).toBe("pending_export");

    const exportResponse = handleBillingHandoffRequest(repository, {
      exportBatchId: "batch-1",
      generatedAt: "2026-04-09T09:00:00+09:00",
      generatedByUserId: "finance-admin-1",
      actorRole: "finance_admin",
      auditEventId: "audit-billing-export-1",
      authorizationAuditEventId: "audit-billing-export-auth-1",
      outboxJobId: "job-billing-export-1",
      lines: [
        {
          requestId: "handoff-request-1",
          supportingAttendanceEvidence: ["attendance-photo-1.jpg"]
        }
      ]
    });

    const exported = expectSuccess(exportResponse);
    expect(exported.rowCount).toBe(1);

    const snapshot = repository.snapshot();

    expect(snapshot.orders[0]).toMatchObject({
      id: "order-1",
      status: "filled",
      slotsFilled: 1
    });
    expect(snapshot.assignments[0]).toMatchObject({
      id: "assignment-1",
      status: "confirmed"
    });
    expect(snapshot.attendance[0]).toMatchObject({
      id: "attendance-1",
      status: "approved",
      approvedByUserId: "ops-manager-1"
    });
    expect(snapshot.billingHandoffRequests[0]).toMatchObject({
      id: "handoff-request-1",
      status: "exported",
      exportBatchId: "batch-1"
    });
    expect(snapshot.billingHandoffBatches[0]).toMatchObject({
      id: "batch-1",
      batchKey: "billing-handoff:batch-1",
      sourceAttendanceIds: ["attendance-1"]
    });
    expect(snapshot.outboxJobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dedupeKey: "invoice-draft:attendance-1",
          topic: "billing.invoice_draft.requested"
        }),
        expect.objectContaining({
          dedupeKey: "billing-handoff:batch-1",
          topic: "billing.invoice_handoff.exported"
        })
      ])
    );
    expect(snapshot.auditEvents.map((event) => event.action)).toEqual([
      "order.published",
      "assignment.committed",
      "attendance.submitted",
      "attendance.approved",
      "billing.finance_handoff_export_authorized",
      "billing.finance_handoff_exported"
    ]);
  });

  it("persists a denied placement override audit without creating an assignment", () => {
    const repository = createSeededRepository();

    handleOrderIntake(repository, {
      orderId: "order-1",
      actorUserId: "ops-manager-1",
      createdAt: "2026-04-07T08:10:00+09:00",
      publish: {
        auditEventId: "audit-order-publish-1",
        publishedAt: "2026-04-07T08:11:00+09:00"
      },
      payload: {
        organizationId: "org-1",
        clientAccountId: "client-1",
        siteId: "site-1",
        roleCode: "picker",
        headcountRequired: 1,
        requiredQualifications: ["forklift"],
        startDate: "2026-04-08",
        endDate: "2026-04-30",
        shiftPattern: "weekday-day",
        billRateKrw: 19000,
        overtimeRuleCode: "std-kr"
      }
    });

    const placementResponse = handlePlacementCommit(repository, {
      assignmentId: "assignment-override-1",
      orderId: "order-1",
      workerId: "worker-blocked-1",
      actorUserId: "ops-operator-1",
      actorRole: "operations_operator",
      auditEventId: "audit-assignment-commit-1",
      authorizationAuditEventId: "audit-assignment-auth-1",
      committedAt: "2026-04-07T08:20:00+09:00",
      sourceChannel: "operator_console",
      payRateKrw: 13000,
      serviceType: "dispatch",
      effectiveDate: "2026-04-08",
      overrideReason: "Attempted document override without manager approval."
    });

    expect(placementResponse.status).toBe(403);
    expect(placementResponse.body).toMatchObject({
      error: {
        code: "role_boundary_denied"
      }
    });
    expect(repository.snapshot().assignments).toHaveLength(0);
    expect(repository.listAuditEvents().map((event) => event.action)).toContain(
      "placement.override_denied"
    );
  });

  it("uses the persisted operator role instead of trusting the request role for overrides", () => {
    const repository = createSeededRepository();

    handleOrderIntake(repository, {
      orderId: "order-1",
      actorUserId: "ops-manager-1",
      createdAt: "2026-04-07T08:10:00+09:00",
      publish: {
        auditEventId: "audit-order-publish-1",
        publishedAt: "2026-04-07T08:11:00+09:00"
      },
      payload: {
        organizationId: "org-1",
        clientAccountId: "client-1",
        siteId: "site-1",
        roleCode: "picker",
        headcountRequired: 1,
        requiredQualifications: ["forklift"],
        startDate: "2026-04-08",
        endDate: "2026-04-30",
        shiftPattern: "weekday-day",
        billRateKrw: 19000,
        overtimeRuleCode: "std-kr"
      }
    });

    const placementResponse = handlePlacementCommit(repository, {
      assignmentId: "assignment-spoofed-role-1",
      orderId: "order-1",
      workerId: "worker-blocked-1",
      actorUserId: "ops-operator-1",
      actorRole: "operations_manager",
      auditEventId: "audit-assignment-commit-1",
      authorizationAuditEventId: "audit-assignment-auth-1",
      committedAt: "2026-04-07T08:20:00+09:00",
      sourceChannel: "operator_console",
      payRateKrw: 13000,
      serviceType: "dispatch",
      effectiveDate: "2026-04-08",
      overrideReason: "Spoofed role should not bypass the override boundary."
    });

    expect(placementResponse.status).toBe(403);
    expect(placementResponse.body).toMatchObject({
      error: {
        code: "role_boundary_denied"
      }
    });
    expect(repository.snapshot().assignments).toHaveLength(0);
    expect(repository.listAuditEvents().at(-1)).toMatchObject({
      action: "placement.override_denied",
      actorUserId: "ops-operator-1",
      payload: {
        actorRole: "operations_operator"
      }
    });
  });

  it("blocks billing handoff export when the underlying attendance row is not approved", () => {
    const repository = createSeededRepository();

    repository.putOrder({
      id: "order-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      siteId: "site-1",
      roleCode: "picker",
      headcountRequired: 1,
      requiredQualifications: ["forklift"],
      slotsFilled: 1,
      startDate: "2026-04-08",
      endDate: "2026-04-30",
      shiftPattern: "weekday-day",
      billRateKrw: 19000,
      overtimeRuleCode: "std-kr",
      status: "filled",
      createdAt: "2026-04-07T08:10:00+09:00",
      updatedAt: "2026-04-07T08:20:00+09:00"
    });
    repository.putAssignment({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-ready-1",
      siteId: "site-1",
      plannedStartDate: "2026-04-08",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      status: "confirmed",
      snapshot: {
        snapshotVersion: 1,
        orderId: "order-1",
        workerId: "worker-ready-1",
        siteId: "site-1",
        payRateKrw: 13000,
        billRateKrw: 19000,
        shiftPattern: "weekday-day",
        effectiveDate: "2026-04-08",
        serviceType: "dispatch"
      },
      createdAt: "2026-04-07T08:20:00+09:00",
      updatedAt: "2026-04-07T08:20:00+09:00"
    });
    repository.putAttendance({
      id: "attendance-1",
      organizationId: "org-1",
      assignmentId: "assignment-1",
      workDate: "2026-04-08",
      scheduledStartAt: "2026-04-08T09:00:00+09:00",
      scheduledEndAt: "2026-04-08T18:00:00+09:00",
      actualStartAt: "2026-04-08T09:00:00+09:00",
      actualEndAt: "2026-04-08T18:00:00+09:00",
      breakMinutes: 60,
      overtimeMinutes: 0,
      status: "submitted",
      source: "site_lead_mobile",
      createdAt: "2026-04-08T18:00:00+09:00",
      updatedAt: "2026-04-08T18:16:00+09:00"
    });
    repository.putBillingHandoffRequest({
      id: "handoff-request-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      siteId: "site-1",
      workerId: "worker-ready-1",
      sourceAssignmentId: "assignment-1",
      sourceAttendanceId: "attendance-1",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30",
      billRateKrw: 19000,
      status: "pending_export",
      requestedAt: "2026-04-08T18:30:00+09:00",
      createdAt: "2026-04-08T18:30:00+09:00",
      updatedAt: "2026-04-08T18:30:00+09:00"
    });

    const exportResponse = handleBillingHandoffRequest(repository, {
      exportBatchId: "batch-1",
      generatedAt: "2026-04-09T09:00:00+09:00",
      generatedByUserId: "finance-admin-1",
      actorRole: "finance_admin",
      auditEventId: "audit-billing-export-1",
      authorizationAuditEventId: "audit-billing-export-auth-1",
      outboxJobId: "job-billing-export-1",
      lines: [{ requestId: "handoff-request-1" }]
    });

    expect(exportResponse.status).toBe(400);
    expect(exportResponse.body).toMatchObject({
      error: {
        code: "invalid_request",
        message: "Only approved attendance can generate finance handoff exports."
      }
    });
    expect(repository.snapshot().billingHandoffBatches).toHaveLength(0);
  });

  it("rejects duplicate billing handoff request ids before export generation", () => {
    const repository = createSeededRepository();

    repository.putOrder({
      id: "order-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      siteId: "site-1",
      roleCode: "picker",
      headcountRequired: 1,
      requiredQualifications: ["forklift"],
      slotsFilled: 1,
      startDate: "2026-04-08",
      endDate: "2026-04-30",
      shiftPattern: "weekday-day",
      billRateKrw: 19000,
      overtimeRuleCode: "std-kr",
      status: "filled",
      createdAt: "2026-04-07T08:10:00+09:00",
      updatedAt: "2026-04-07T08:20:00+09:00"
    });
    repository.putAssignment({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-ready-1",
      siteId: "site-1",
      plannedStartDate: "2026-04-08",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      status: "confirmed",
      snapshot: {
        snapshotVersion: 1,
        orderId: "order-1",
        workerId: "worker-ready-1",
        siteId: "site-1",
        payRateKrw: 13000,
        billRateKrw: 19000,
        shiftPattern: "weekday-day",
        effectiveDate: "2026-04-08",
        serviceType: "dispatch"
      },
      createdAt: "2026-04-07T08:20:00+09:00",
      updatedAt: "2026-04-07T08:20:00+09:00"
    });
    repository.putAttendance({
      id: "attendance-1",
      organizationId: "org-1",
      assignmentId: "assignment-1",
      workDate: "2026-04-08",
      scheduledStartAt: "2026-04-08T09:00:00+09:00",
      scheduledEndAt: "2026-04-08T18:00:00+09:00",
      actualStartAt: "2026-04-08T09:00:00+09:00",
      actualEndAt: "2026-04-08T18:00:00+09:00",
      breakMinutes: 60,
      overtimeMinutes: 0,
      status: "approved",
      source: "site_lead_mobile",
      approvedAt: "2026-04-08T18:10:00+09:00",
      approvedByUserId: "ops-manager-1",
      createdAt: "2026-04-08T18:00:00+09:00",
      updatedAt: "2026-04-08T18:10:00+09:00"
    });
    repository.putBillingHandoffRequest({
      id: "handoff-request-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      siteId: "site-1",
      workerId: "worker-ready-1",
      sourceAssignmentId: "assignment-1",
      sourceAttendanceId: "attendance-1",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30",
      billRateKrw: 19000,
      status: "pending_export",
      requestedAt: "2026-04-08T18:10:00+09:00",
      createdAt: "2026-04-08T18:10:00+09:00",
      updatedAt: "2026-04-08T18:10:00+09:00"
    });

    const exportResponse = handleBillingHandoffRequest(repository, {
      exportBatchId: "batch-1",
      generatedAt: "2026-04-09T09:00:00+09:00",
      generatedByUserId: "finance-admin-1",
      actorRole: "finance_admin",
      auditEventId: "audit-billing-export-1",
      authorizationAuditEventId: "audit-billing-export-auth-1",
      outboxJobId: "job-billing-export-1",
      lines: [{ requestId: "handoff-request-1" }, { requestId: "handoff-request-1" }]
    });

    expect(exportResponse.status).toBe(400);
    expect(exportResponse.body).toMatchObject({
      error: {
        code: "invalid_request",
        message:
          "Billing handoff request handoff-request-1 appears multiple times in the export payload."
      }
    });
    expect(repository.snapshot().billingHandoffBatches).toHaveLength(0);
    expect(repository.listOutboxJobs()).toHaveLength(0);
  });
});

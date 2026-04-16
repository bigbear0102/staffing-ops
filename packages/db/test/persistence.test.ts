import { describe, expect, it } from "vitest";

import {
  createInMemoryStaffingPersistence,
  PersistenceConflictError
} from "../src/index.js";

describe("staffing persistence runtime", () => {
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
          id: "worker-1",
          organizationId: "org-1",
          legalName: "Worker Kim",
          phoneE164: "+821012345678",
          residencyStatus: "citizen",
          skillTags: ["warehouse"],
          heldQualifications: ["forklift"],
          qualificationStatus: "qualified",
          documentReadiness: "ready",
          availabilityStatus: "available",
          availabilityDetail: "available",
          payrollReference: "PAY-1",
          active: true,
          createdAt: "2026-04-07T08:00:00+09:00",
          updatedAt: "2026-04-07T08:00:00+09:00"
        }
      ]
    });

    return repository;
  }

  it("preserves assignment snapshot immutability after the first persistence write", () => {
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
      workerId: "worker-1",
      siteId: "site-1",
      plannedStartDate: "2026-04-08",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      status: "confirmed",
      snapshot: {
        snapshotVersion: 1,
        orderId: "order-1",
        workerId: "worker-1",
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

    expect(() =>
      repository.putAssignment({
        id: "assignment-1",
        organizationId: "org-1",
        clientAccountId: "client-1",
        orderId: "order-1",
        workerId: "worker-1",
        siteId: "site-1",
        plannedStartDate: "2026-04-08",
        plannedEndDate: "2026-04-30",
        sourceChannel: "operator_console",
        status: "confirmed",
        snapshot: {
          snapshotVersion: 1,
          orderId: "order-1",
          workerId: "worker-1",
          siteId: "site-1",
          payRateKrw: 14000,
          billRateKrw: 19000,
          shiftPattern: "weekday-day",
          effectiveDate: "2026-04-08",
          serviceType: "dispatch"
        },
        createdAt: "2026-04-07T08:20:00+09:00",
        updatedAt: "2026-04-07T09:00:00+09:00"
      })
    ).toThrowError(PersistenceConflictError);
  });

  it("upserts billing handoff requests and outbox jobs on their idempotency anchors", () => {
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
      workerId: "worker-1",
      siteId: "site-1",
      plannedStartDate: "2026-04-08",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      status: "confirmed",
      snapshot: {
        snapshotVersion: 1,
        orderId: "order-1",
        workerId: "worker-1",
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
      workerId: "worker-1",
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
    repository.putBillingHandoffRequest({
      id: "handoff-request-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      siteId: "site-1",
      workerId: "worker-1",
      sourceAssignmentId: "assignment-1",
      sourceAttendanceId: "attendance-1",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30",
      billRateKrw: 19000,
      status: "pending_export",
      requestedAt: "2026-04-08T18:10:00+09:00",
      createdAt: "2026-04-08T18:10:00+09:00",
      updatedAt: "2026-04-08T18:30:00+09:00"
    });
    repository.putOutboxJob({
      id: "job-1",
      organizationId: "org-1",
      topic: "billing.invoice_draft.requested",
      status: "pending",
      dedupeKey: "invoice-draft:attendance-1",
      payload: { sourceAttendanceId: "attendance-1" },
      scheduledAt: "2026-04-08T18:10:00+09:00",
      attempts: 0,
      maxAttempts: 10,
      createdAt: "2026-04-08T18:10:00+09:00",
      updatedAt: "2026-04-08T18:10:00+09:00"
    });
    repository.putOutboxJob({
      id: "job-2",
      organizationId: "org-1",
      topic: "billing.invoice_draft.requested",
      status: "pending",
      dedupeKey: "invoice-draft:attendance-1",
      payload: { sourceAttendanceId: "attendance-1", corrected: true },
      scheduledAt: "2026-04-08T18:30:00+09:00",
      attempts: 0,
      maxAttempts: 10,
      createdAt: "2026-04-08T18:30:00+09:00",
      updatedAt: "2026-04-08T18:30:00+09:00"
    });

    const snapshot = repository.snapshot();

    expect(snapshot.billingHandoffRequests).toHaveLength(1);
    expect(snapshot.billingHandoffRequests[0]).toMatchObject({
      id: "handoff-request-1",
      updatedAt: "2026-04-08T18:30:00+09:00"
    });
    expect(snapshot.outboxJobs).toHaveLength(1);
    expect(snapshot.outboxJobs[0]).toMatchObject({
      id: "job-1",
      dedupeKey: "invoice-draft:attendance-1",
      payload: {
        sourceAttendanceId: "attendance-1",
        corrected: true
      }
    });
  });
});

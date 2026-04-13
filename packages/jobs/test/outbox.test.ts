import { describe, expect, it } from "vitest";

import {
  createBillingHandoffExportOutboxJob,
  createInvoiceDraftOutboxJob
} from "../src/index.js";

describe("invoice draft outbox jobs", () => {
  it("uses the approved attendance row as the idempotency anchor", () => {
    const job = createInvoiceDraftOutboxJob({
      jobId: "job-1",
      scheduledAt: "2026-04-07T18:40:00+09:00",
      request: {
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
      }
    });

    expect(job).toMatchObject({
      topic: "billing.invoice_draft.requested",
      dedupeKey: "invoice-draft:attendance-1",
      status: "pending",
      attempts: 0
    });
  });
});

describe("billing handoff export outbox jobs", () => {
  it("uses the finance batch key as the export idempotency anchor", () => {
    const job = createBillingHandoffExportOutboxJob({
      jobId: "job-2",
      scheduledAt: "2026-04-08T09:00:00+09:00",
      artifact: {
        exportBatchId: "batch-1",
        organizationId: "org-1",
        batchKey: "billing-handoff:batch-1",
        clientAccountId: "client-1",
        siteId: "site-1",
        billingPeriodStart: "2026-04-01",
        billingPeriodEnd: "2026-04-30",
        generatedAt: "2026-04-08T09:00:00+09:00",
        generatedByUserId: "finance-1",
        format: "csv",
        columns: ["exportBatchId", "batchKey"],
        rows: [],
        csvContent: "exportBatchId,batchKey",
        sourceAttendanceIds: ["attendance-1"],
        sourceAssignmentSnapshots: [
          {
            assignmentId: "assignment-1",
            orderId: "order-1",
            workerId: "worker-1",
            siteId: "site-1",
            snapshot: {
              snapshotVersion: 1,
              orderId: "order-1",
              workerId: "worker-1",
              siteId: "site-1",
              payRateKrw: 12000,
              billRateKrw: 18000,
              shiftPattern: "weekday-day",
              effectiveDate: "2026-04-07",
              serviceType: "dispatch"
            }
          }
        ]
      }
    });

    expect(job).toMatchObject({
      topic: "billing.invoice_handoff.exported",
      dedupeKey: "billing-handoff:batch-1",
      status: "pending",
      attempts: 0,
      payload: {
        exportBatchId: "batch-1",
        batchKey: "billing-handoff:batch-1",
        sourceAttendanceIds: ["attendance-1"]
      }
    });
  });
});

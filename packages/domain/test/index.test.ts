import { describe, expect, it } from "vitest";

import { createAssignmentSnapshot } from "../src/index.js";

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

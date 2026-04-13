import { describe, expect, it } from "vitest";

import {
  adminShellManifest,
  createAdminDemoShell,
  renderAdminDemoHtml
} from "../../apps/admin/src/index.js";

describe("admin shell demo", () => {
  it("covers the documented operator navigation and seeded screens", () => {
    expect(adminShellManifest.navigation).toEqual([
      "Work Queue",
      "Demand",
      "Placement",
      "Attendance",
      "Billing",
      "Site Lead Roster"
    ]);
    expect(adminShellManifest.seededScreens).toContain("attendance-exception-queue");
    expect(adminShellManifest.seededScreens).toContain("site-lead-mobile-roster");
  });

  it("keeps the desktop shell queue-first while exposing mobile site-lead roster actions", () => {
    const desktopShell = createAdminDemoShell();
    const mobileShell = createAdminDemoShell({ viewport: "mobile" });

    expect(desktopShell.activeRoute).toBe("work-queue");
    expect(mobileShell.activeRoute).toBe("site-lead-roster");
    expect(mobileShell.screens.siteLeadRoster.shifts[0]?.quickActions).toEqual([
      "attendance",
      "exception",
      "evidence"
    ]);
    expect(mobileShell.screens.siteLeadRoster.shifts[1]?.attendanceSyncStatus).toBe("Pending sync");
    expect(mobileShell.screens.siteLeadRoster.shifts[1]?.duplicateSubmitGuardNote).toContain(
      "no duplicate attendance submission"
    );
    expect(mobileShell.screens.siteLeadRoster.shifts[2]?.evidenceUploadStatus).toBe(
      "Retry required"
    );
  });

  it("renders seeded billing and mobile recovery surfaces into inspectable HTML", () => {
    const billingHtml = renderAdminDemoHtml({ routeId: "billing" });
    const placementHtml = renderAdminDemoHtml({ routeId: "placement" });
    const rosterHtml = renderAdminDemoHtml({ routeId: "site-lead-roster", viewport: "mobile" });

    expect(billingHtml).toContain("Billing handoff queue");
    expect(billingHtml).toContain("Batch review");
    expect(billingHtml).toContain("Export batch ID");
    expect(billingHtml).toContain("Source trace");
    expect(placementHtml).toContain("Audit timeline");
    expect(placementHtml).toContain("Correlated proof IDs");
    expect(placementHtml).toContain("Review drawer");
    expect(rosterHtml).toContain("Site lead mobile roster");
    expect(rosterHtml).toContain("Pending sync");
    expect(rosterHtml).toContain("Retry required");
    expect(rosterHtml).toContain("Duplicate guard");
    expect(rosterHtml).toContain("site-lead:roster-2:2026-04-11:check-in");
  });
});

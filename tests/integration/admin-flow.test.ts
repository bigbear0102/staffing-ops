import { describe, expect, it } from "vitest";

import {
  approveAttendanceRecord,
  commitSelectedPlacement,
  createAdminOperatorFlow,
  createAdminOperatorShell,
  enablePlacementOverride,
  openAttendanceRecord,
  openBillingDraft,
  openDemandOrder,
  openPlacementOrder,
  publishDemandOrderDraft,
  renderAdminOperatorHtml,
  selectPlacementCandidate,
  updateDemandOrderDraft
} from "../../apps/admin/src/index.js";

function getSummaryValue(label: string, shell: ReturnType<typeof createAdminOperatorShell>): number {
  const summaryCard = shell.screens.workQueue.summaryCards.find((card) => card.label === label);

  if (!summaryCard) {
    throw new Error(`Expected summary card '${label}' to exist.`);
  }

  return summaryCard.value;
}

describe("admin operator flow", () => {
  it("publishes a blocked demand draft into the staffing queue after commercial edits", () => {
    const flow = createAdminOperatorFlow();
    const opened = openDemandOrder(flow, "order-incheon-cold-chain");
    const edited = updateDemandOrderDraft(opened, "order-incheon-cold-chain", {
      billRateKrw: 21400,
      overtimeRule: "Meal allowance after 8h and Saturday premium"
    });
    const published = publishDemandOrderDraft(edited, "order-incheon-cold-chain");
    const shell = createAdminOperatorShell(published);
    const needsStaffingOrders =
      shell.screens.workQueue.groups.find((group) => group.label === "Needs staffing")?.items ?? [];
    const complianceOrders =
      shell.screens.workQueue.groups.find((group) => group.label === "Compliance missing")?.items
      ?? [];

    expect(shell.screens.demand.editorOrder.status).toBe("ready_for_staffing");
    expect(shell.screens.demand.editorIsPublishReady).toBe(true);
    expect(shell.screens.demand.editorBlockers).toEqual([]);
    expect(needsStaffingOrders.some((item) => item.orderId === "order-incheon-cold-chain")).toBe(
      true
    );
    expect(
      complianceOrders.some((item) => item.orderId === "order-incheon-cold-chain")
    ).toBe(false);
    expect(renderAdminOperatorHtml(published)).toContain("Publish ready");
  });

  it("forces an explicit override before committing a blocked candidate and reflects the result in queue state", () => {
    const flow = createAdminOperatorFlow();
    const placement = openPlacementOrder(flow, "order-seoul-east-mall");
    const blocked = selectPlacementCandidate(placement, "candidate-minsu-lee");

    expect(blocked.placementDecisionState.actionLabel).toBe("Override required");
    expect(() => commitSelectedPlacement(blocked)).toThrow("requires an override");

    const overridden = enablePlacementOverride(
      blocked,
      "Site manager approved first-shift gate check for the expiring artifact."
    );
    const committed = commitSelectedPlacement(overridden, {
      committedAt: "2026-04-07T10:20:00+09:00",
      committedBy: "Ops coordinator B"
    });
    const shell = createAdminOperatorShell(committed);
    const staffingItem = shell.screens.workQueue.groups
      .find((group) => group.label === "Needs staffing")
      ?.items.find((item) => item.orderId === "order-seoul-east-mall");

    expect(shell.screens.placement.order.filledHeadcount).toBe(9);
    expect(shell.screens.placement.order.status).toBe("partially_filled");
    expect(shell.screens.placement.lastCommittedAssignment?.mode).toBe("override");
    expect(shell.screens.placement.lastCommittedAssignment?.assignmentId).toBe(
      "assignment-order-seoul-east-mall-candidate-minsu-lee"
    );
    expect(shell.screens.placement.lastCommittedAssignment?.overrideReason).toContain(
      "Site manager approved first-shift gate check"
    );
    expect(getSummaryValue("Unfilled headcount", shell)).toBe(7);
    expect(staffingItem?.blocker).toContain("3 heads still open");
    expect(renderAdminOperatorHtml(committed)).toContain("Latest assignment commit");
    expect(renderAdminOperatorHtml(committed)).toContain(
      "Assignment ID: assignment-order-seoul-east-mall-candidate-minsu-lee"
    );
    expect(renderAdminOperatorHtml(committed)).toContain(
      "Override reason: Site manager approved first-shift gate check for the expiring artifact."
    );
  });

  it("turns an approved attendance review into a handoff-ready billing batch with audit proof", () => {
    const flow = createAdminOperatorFlow();
    const openedAttendance = openAttendanceRecord(flow, "att-2");
    const beforeShell = createAdminOperatorShell(openedAttendance);
    const approved = approveAttendanceRecord(openedAttendance, "att-2", {
      approvedAt: "2026-04-09 08:05 KST",
      approvedBy: "Ops manager / J. Han"
    });
    const approvedHtml = renderAdminOperatorHtml(approved);
    const billingRoute = openBillingDraft(approved, "bill-2");
    const afterShell = createAdminOperatorShell(billingRoute);
    const selectedAttendance = afterShell.screens.attendance.rows.find((record) => record.id === "att-2");

    expect(beforeShell.screens.billing.selectedDraft.status).toBe("approval_blocked");
    expect(beforeShell.screens.billing.selectedDraft.blockedBy[0]).toContain("att-2");
    expect(selectedAttendance?.status).toBe("approved");
    expect(selectedAttendance?.assignmentId).toBe("assignment-suwon-inspection-1");
    expect(selectedAttendance?.auditTrail[0]?.title).toBe("Attendance approved");
    expect(selectedAttendance?.auditTrail[0]?.actorName).toBe("Ops manager / J. Han");
    expect(afterShell.screens.billing.selectedDraft.status).toBe("ready_for_handoff");
    expect(afterShell.screens.billing.selectedDraft.blockedBy).toEqual([]);
    expect(afterShell.screens.billing.selectedDraft.batch.generatedBy).toBe("Ops manager / J. Han");
    expect(afterShell.screens.billing.selectedDraft.lineItems[0]?.attendanceSource).toContain(
      "approved"
    );
    expect(getSummaryValue("Invoice blockers", afterShell)).toBe(1);
    expect(approvedHtml).toContain("Assignment ID: assignment-suwon-inspection-1");
    expect(approvedHtml).toContain("Attendance ID: att-2");
    expect(approvedHtml).toContain("Export batch ID: batch-suwon-week2");
    expect(renderAdminOperatorHtml(billingRoute)).toContain("Batch review");
    expect(renderAdminOperatorHtml(billingRoute)).toContain("Assignment IDs: assignment-suwon-inspection-1");
    expect(renderAdminOperatorHtml(billingRoute)).toContain("Attendance IDs: att-2");
    expect(renderAdminOperatorHtml(billingRoute)).toContain("Export batch ID: batch-suwon-week2");
    expect(renderAdminOperatorHtml(billingRoute)).toContain("assignment-suwon-inspection-1 -&gt; att-2");
    expect(renderAdminOperatorHtml(billingRoute)).toContain("Approval gate cleared");
  });

  it("keeps blocked billing proof traceable to the same draft, batch, and source ids", () => {
    const flow = createAdminOperatorFlow();
    const blockedBilling = openBillingDraft(flow, "bill-3");
    const html = renderAdminOperatorHtml(blockedBilling);

    expect(html).toContain("Billing draft ID: bill-3");
    expect(html).toContain("Export batch ID: batch-suwon-cutoff-breach");
    expect(html).toContain("Assignment IDs: assignment-suwon-inspection-2");
    expect(html).toContain("Attendance IDs: att-4");
    expect(html).toContain("Missing submission at cutoff");
  });
});

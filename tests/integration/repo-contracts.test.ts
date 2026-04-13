import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { adminShellManifest } from "../../apps/admin/src/index.ts";
import {
  apiServiceManifest,
  bootstrapOrderRecord,
  bootstrapAssignmentRecord,
  buildAttendanceCorrectionEnvelope,
  buildAssignmentCommitEnvelope,
  buildFinanceHandoffExportEnvelope,
  buildAttendanceSubmissionEnvelope,
  buildOrderPublishEnvelope,
  buildAttendanceApprovalEnvelope
} from "../../apps/api/src/index.ts";
import { staffingDbManifest } from "../../packages/db/src/index.ts";
import { systemProfile } from "../../packages/domain/src/index.ts";
import { jobQueueManifest } from "../../packages/jobs/src/index.ts";

describe("workspace baseline", () => {
  it("keeps the public-mode bundle workflow documented at the repo root", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8")
    ) as { scripts?: Record<string, string> };
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
    const prTemplate = readFileSync(
      new URL("../../.github/pull_request_template.md", import.meta.url),
      "utf8"
    );
    const issueConfig = readFileSync(
      new URL("../../.github/ISSUE_TEMPLATE/config.yml", import.meta.url),
      "utf8"
    );
    const externalBugTemplate = readFileSync(
      new URL("../../.github/ISSUE_TEMPLATE/external-bug-report.yml", import.meta.url),
      "utf8"
    );
    const branchValidator = readFileSync(
      new URL("../../scripts/validate-branch-name.mjs", import.meta.url),
      "utf8"
    );
    const prValidator = readFileSync(
      new URL("../../scripts/validate-pr-metadata.mjs", import.meta.url),
      "utf8"
    );
    const ciWorkflow = readFileSync(
      new URL("../../.github/workflows/ci.yml", import.meta.url),
      "utf8"
    );
    const governanceWorkflow = readFileSync(
      new URL("../../.github/workflows/pull-request-governance.yml", import.meta.url),
      "utf8"
    );
    const gitignore = readFileSync(new URL("../../.gitignore", import.meta.url), "utf8");

    expect(packageJson.scripts).toMatchObject({
      "demo:bundle": "pnpm build && node scripts/export-demo-bundle.mjs",
      "public:preflight": "node scripts/public-repo-preflight.mjs"
    });
    expect(readme).toContain("공개 저장소 가드레일");
    expect(readme).toContain("pnpm demo:bundle");
    expect(readme).toContain("pnpm public:preflight -- --require-public");
    expect(readme).toContain("artifacts/demo-bundle/README.md");
    expect(prTemplate).toContain("연결된 Paperclip 이슈");
    expect(prTemplate).toContain("변경 요약");
    expect(issueConfig).toContain("내부 전달 작업");
    expect(externalBugTemplate).toContain("외부 버그 제보");
    expect(externalBugTemplate).toContain("재현 단계");
    expect(branchValidator).toContain("브랜치 이름");
    expect(prValidator).toContain("PR 제목은");
    expect(prValidator).toContain("## 연결된 Paperclip 이슈");
    expect(readme).toContain("demo-bundle");
    expect(ciWorkflow).toContain("demo-bundle:");
    expect(ciWorkflow).toContain("pnpm demo:bundle");
    expect(ciWorkflow).toContain("actions/upload-artifact@v4");
    expect(governanceWorkflow).toContain("PR 거버넌스");
    expect(governanceWorkflow).toContain("브랜치 이름 검증");
    expect(gitignore).toContain("artifacts/demo-bundle/");
    expect(
      readFileSync(new URL("../../docs/public-repo-scrub-checklist.md", import.meta.url), "utf8")
    ).toContain("공개 저장소 전환 점검표");
    expect(
      readFileSync(new URL("../../docs/public-repo-scrub-checklist.md", import.meta.url), "utf8")
    ).toContain("pnpm public:preflight -- --require-public");
    expect(readme).not.toContain("Private delivery repository");
  });

  it("accepts the Korean PR template in governance validation", () => {
    const body = [
      "## 연결된 Paperclip 이슈",
      "- [CMPAAAAAAAA-15](/CMPAAAAAAAA/issues/CMPAAAAAAAA-15)",
      "",
      "## 변경 요약",
      "- GitHub 표면을 한국어로 정리했습니다.",
      "",
      "## 리스크 메모",
      "- branch protection check 이름은 유지합니다.",
      "",
      "## 검증 메모",
      "- `pnpm check`"
    ].join("\n");

    const result = spawnSync(
      process.execPath,
      [
        new URL("../../scripts/validate-pr-metadata.mjs", import.meta.url).pathname,
        "[CMPAAAAAAAA-15] GitHub 표면 한국어 정리",
        body
      ],
      { encoding: "utf8" }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("PR 메타데이터 확인 완료.");
  });

  it("runs the public preflight in local-only mode", () => {
    const result = spawnSync(
      process.execPath,
      [
        new URL("../../scripts/public-repo-preflight.mjs", import.meta.url).pathname,
        "--skip-demo-bundle",
        "--skip-github"
      ],
      { encoding: "utf8" }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("공개 저장소 preflight 결과");
    expect(result.stdout).toContain("[통과] 필수 공개 준비 파일 존재");
  });

  it("keeps admin, API, and domain profiles aligned to the initial Korea-only operating model", () => {
    expect(adminShellManifest.defaultTimezone).toBe(systemProfile.timezone);
    expect(apiServiceManifest.currency).toBe(systemProfile.currency);
    expect(adminShellManifest.targetPersona).toBe(systemProfile.primaryPersona);
  });

  it("keeps API ownership aligned with the DB tables and queued job topics it must operate", () => {
    expect(apiServiceManifest.persistenceTables).toEqual([
      ...staffingDbManifest.coreTables
    ]);
    expect(apiServiceManifest.jobTopics).toEqual([
      ...jobQueueManifest.supportedTopics
    ]);
  });

  it("threads the core workflow from assignment snapshot to invoice draft outbox job", () => {
    const assignment = bootstrapAssignmentRecord({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-1",
      siteId: "site-1",
      payRateKrw: 13000,
      billRateKrw: 19000,
      shiftPattern: "weekday-day",
      effectiveDate: "2026-04-07",
      serviceType: "dispatch",
      plannedStartDate: "2026-04-07",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      createdAt: "2026-04-07T08:00:00+09:00"
    });

    const envelope = buildAttendanceApprovalEnvelope({
      assignment,
      attendance: {
        id: "attendance-1",
        organizationId: "org-1",
        assignmentId: assignment.id,
        workDate: "2026-04-07",
        scheduledStartAt: "2026-04-07T09:00:00+09:00",
        scheduledEndAt: "2026-04-07T18:00:00+09:00",
        actualStartAt: "2026-04-07T09:01:00+09:00",
        actualEndAt: "2026-04-07T18:31:00+09:00",
        breakMinutes: 60,
        overtimeMinutes: 30,
        status: "submitted",
        source: "site_lead_mobile",
        createdAt: "2026-04-07T18:05:00+09:00",
        updatedAt: "2026-04-07T18:05:00+09:00"
      },
      approverUserId: "operator-1",
      approvedAt: "2026-04-07T18:40:00+09:00",
      auditEventId: "audit-1",
      outboxJobId: "job-1",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30"
    });

    expect(envelope.attendance.status).toBe("approved");
    expect(envelope.auditEvent.action).toBe("attendance.approved");
    expect(envelope.outboxJob.topic).toBe("billing.invoice_draft.requested");
  });

  it("keeps attendance correction and re-approval on the API contract before billing handoff", () => {
    const submitted = buildAttendanceSubmissionEnvelope({
      attendance: {
        id: "attendance-1",
        organizationId: "org-1",
        assignmentId: "assignment-1",
        workDate: "2026-04-07",
        scheduledStartAt: "2026-04-07T09:00:00+09:00",
        scheduledEndAt: "2026-04-07T18:00:00+09:00",
        actualStartAt: "2026-04-07T09:01:00+09:00",
        actualEndAt: "2026-04-07T18:20:00+09:00",
        breakMinutes: 60,
        overtimeMinutes: 20,
        status: "captured",
        source: "site_lead_mobile",
        createdAt: "2026-04-07T18:05:00+09:00",
        updatedAt: "2026-04-07T18:05:00+09:00"
      },
      submittedByUserId: "site-lead-1",
      submittedAt: "2026-04-07T18:21:00+09:00",
      auditEventId: "audit-submit-1"
    });

    const corrected = buildAttendanceCorrectionEnvelope({
      attendance: {
        ...submitted.attendance,
        status: "approved",
        approvedAt: "2026-04-07T18:40:00+09:00",
        approvedByUserId: "operator-1",
        updatedAt: "2026-04-07T18:40:00+09:00"
      },
      correctedByUserId: "operator-2",
      actorRole: "operations_operator",
      correctedAt: "2026-04-08T09:00:00+09:00",
      auditEventId: "audit-correct-1",
      authorizationAuditEventId: "audit-correct-auth-1",
      correctionReason: "Retro overtime evidence arrived after day-close.",
      actualEndAt: "2026-04-07T18:31:00+09:00",
      overtimeMinutes: 31
    });

    const assignment = bootstrapAssignmentRecord({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-1",
      siteId: "site-1",
      payRateKrw: 13000,
      billRateKrw: 19000,
      shiftPattern: "weekday-day",
      effectiveDate: "2026-04-07",
      serviceType: "dispatch",
      plannedStartDate: "2026-04-07",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      createdAt: "2026-04-07T08:00:00+09:00"
    });

    const reapproved = buildAttendanceApprovalEnvelope({
      assignment,
      attendance: corrected.attendance,
      approverUserId: "operator-3",
      approvedAt: "2026-04-08T09:10:00+09:00",
      auditEventId: "audit-approve-2",
      outboxJobId: "job-2",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30"
    });

    expect(apiServiceManifest.workflowInterfaces).toEqual(
      expect.arrayContaining(["attendance_submit", "attendance_correction", "attendance_approval"])
    );
    expect(corrected.auditEvent.action).toBe("attendance.corrected");
    expect(corrected.authorizationAuditEvent.action).toBe("attendance.correction_authorized");
    expect(reapproved.auditEvent.payload).toMatchObject({ previousStatus: "corrected" });
    expect(reapproved.outboxJob.payload).toMatchObject({
      sourceAttendanceId: "attendance-1",
      billRateKrw: 19000
    });
  });

  it("threads approved invoice handoff rows into a spreadsheet-first export batch", () => {
    const assignment = bootstrapAssignmentRecord({
      id: "assignment-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      orderId: "order-1",
      workerId: "worker-1",
      siteId: "site-1",
      payRateKrw: 13000,
      billRateKrw: 19000,
      shiftPattern: "weekday-day",
      effectiveDate: "2026-04-07",
      serviceType: "dispatch",
      plannedStartDate: "2026-04-07",
      plannedEndDate: "2026-04-30",
      sourceChannel: "operator_console",
      createdAt: "2026-04-07T08:00:00+09:00"
    });
    const approval = buildAttendanceApprovalEnvelope({
      assignment,
      attendance: {
        id: "attendance-1",
        organizationId: "org-1",
        assignmentId: assignment.id,
        workDate: "2026-04-07",
        scheduledStartAt: "2026-04-07T09:00:00+09:00",
        scheduledEndAt: "2026-04-07T18:00:00+09:00",
        actualStartAt: "2026-04-07T09:01:00+09:00",
        actualEndAt: "2026-04-07T18:31:00+09:00",
        breakMinutes: 60,
        overtimeMinutes: 30,
        status: "submitted",
        source: "site_lead_mobile",
        createdAt: "2026-04-07T18:05:00+09:00",
        updatedAt: "2026-04-07T18:05:00+09:00"
      },
      approverUserId: "operator-1",
      approvedAt: "2026-04-07T18:40:00+09:00",
      auditEventId: "audit-1",
      outboxJobId: "job-1",
      billingPeriodStart: "2026-04-01",
      billingPeriodEnd: "2026-04-30"
    });

    const exportEnvelope = buildFinanceHandoffExportEnvelope({
      exportBatchId: "batch-1",
      auditEventId: "audit-export-1",
      outboxJobId: "job-export-1",
      generatedAt: "2026-04-08T09:00:00+09:00",
      generatedByUserId: "finance-1",
      actorRole: "finance_admin",
      authorizationAuditEventId: "audit-export-auth-1",
      lines: [
        {
          invoiceDraftRequest: approval.invoiceDraftRequest,
          assignment,
          attendance: approval.attendance
        }
      ]
    });

    expect(apiServiceManifest.workflowInterfaces).toEqual(
      expect.arrayContaining(["finance_handoff_export"])
    );
    expect(exportEnvelope.exportArtifact).toMatchObject({
      exportBatchId: "batch-1",
      batchKey: "billing-handoff:batch-1",
      sourceAttendanceIds: ["attendance-1"]
    });
    expect(exportEnvelope.auditEvent.payload).toMatchObject({
      batchKey: "billing-handoff:batch-1"
    });
    expect(exportEnvelope.authorizationAuditEvent.action).toBe(
      "billing.finance_handoff_export_authorized"
    );
    expect(exportEnvelope.outboxJob).toMatchObject({
      topic: "billing.invoice_handoff.exported",
      dedupeKey: "billing-handoff:batch-1",
      payload: {
        batchKey: "billing-handoff:batch-1",
        sourceAttendanceIds: ["attendance-1"]
      }
    });
    expect(staffingDbManifest.coreTables).toContain("billing_handoff_batches");
  });

  it("threads order intake into assignment commit with fill-state and audit continuity", () => {
    const draftOrder = bootstrapOrderRecord({
      id: "order-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      siteId: "site-1",
      roleCode: "warehouse-picker",
      headcountRequired: 1,
      requiredQualifications: ["forklift"],
      startDate: "2026-04-08",
      endDate: "2026-04-30",
      shiftPattern: "weekday-day",
      billRateKrw: 19000,
      overtimeRuleCode: "std-kr",
      createdAt: "2026-04-07T08:00:00+09:00"
    });

    const published = buildOrderPublishEnvelope({
      order: draftOrder,
      actorUserId: "operator-1",
      auditEventId: "audit-order-1",
      publishedAt: "2026-04-07T08:10:00+09:00"
    });

    const committed = buildAssignmentCommitEnvelope({
      assignmentId: "assignment-1",
      order: published.order,
      worker: {
        id: "worker-1",
        organizationId: "org-1",
        legalName: "Kim Worker",
        phoneE164: "+821012341234",
        residencyStatus: "citizen",
        skillTags: ["warehouse"],
        heldQualifications: ["forklift"],
        qualificationStatus: "qualified",
        documentReadiness: "ready",
        availabilityStatus: "available",
        availabilityDetail: "Available now",
        payrollReference: "PAY-001",
        active: true,
        createdAt: "2026-04-07T08:00:00+09:00",
        updatedAt: "2026-04-07T08:00:00+09:00"
      },
      actorUserId: "operator-1",
      actorRole: "operations_operator",
      auditEventId: "audit-assignment-1",
      committedAt: "2026-04-07T08:20:00+09:00",
      sourceChannel: "operator_console",
      payRateKrw: 13000,
      serviceType: "dispatch",
      effectiveDate: "2026-04-08"
    });

    expect(published.auditEvent.action).toBe("order.published");
    expect(committed.assignment.status).toBe("confirmed");
    expect(committed.order.status).toBe("filled");
    expect(committed.order.slotsFilled).toBe(1);
    expect(committed.auditEvent.action).toBe("assignment.committed");
  });

  it("exposes denied role-boundary audit proof on the API contract", () => {
    const draftOrder = bootstrapOrderRecord({
      id: "order-1",
      organizationId: "org-1",
      clientAccountId: "client-1",
      siteId: "site-1",
      roleCode: "warehouse-picker",
      headcountRequired: 1,
      requiredQualifications: ["forklift"],
      startDate: "2026-04-08",
      endDate: "2026-04-30",
      shiftPattern: "weekday-day",
      billRateKrw: 19000,
      overtimeRuleCode: "std-kr",
      createdAt: "2026-04-07T08:00:00+09:00"
    });
    const published = buildOrderPublishEnvelope({
      order: draftOrder,
      actorUserId: "operator-1",
      auditEventId: "audit-order-1",
      publishedAt: "2026-04-07T08:10:00+09:00"
    });

    let denial: unknown;

    try {
      buildAssignmentCommitEnvelope({
        assignmentId: "assignment-1",
        order: published.order,
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
          availabilityDetail: "Available now",
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
        overrideReason: "Operator attempted override without escalation."
      });
    } catch (error) {
      denial = error;
    }

    expect(denial).toMatchObject({
      name: "RoleBoundaryAuthorizationError"
    });
    expect((denial as { auditEvent: unknown }).auditEvent).toMatchObject({
      action: "placement.override_denied",
      payload: {
        actorRole: "operations_operator",
        decision: "denied"
      }
    });
  });
});

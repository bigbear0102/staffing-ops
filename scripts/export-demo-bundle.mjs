import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  approveAttendanceRecord,
  commitSelectedPlacement,
  createAdminOperatorFlow,
  enablePlacementOverride,
  openAttendanceRecord,
  openBillingDraft,
  openDemandOrder,
  openPlacementOrder,
  publishDemandOrderDraft,
  renderAdminDemoHtml,
  renderAdminOperatorHtml,
  selectPlacementCandidate,
  updateDemandOrderDraft
} from "../apps/admin/dist/index.js";
import { buildDesignPartnerPilotProofBundle } from "../apps/api/dist/index.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(rootDir, "artifacts", "demo-bundle");

async function writeText(relativePath, contents) {
  const targetPath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, contents, "utf8");
  return relativePath;
}

async function writeJson(relativePath, value) {
  return writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function buildFlowSnapshots() {
  const baselineState = createAdminOperatorFlow();
  const demandDraftState = openDemandOrder(baselineState, "order-incheon-cold-chain");
  const demandReadyState = updateDemandOrderDraft(demandDraftState, "order-incheon-cold-chain", {
    attendanceApprovalMethod: "Site lead roster confirmation + gate photo evidence",
    billRateKrw: 20500,
    overtimeRule: "Meal allowance after 8h and paid transport after 22:00",
    shiftPattern: "Tue-Sat / 06:00-15:00"
  });
  const demandPublishedState = publishDemandOrderDraft(demandReadyState, "order-incheon-cold-chain");
  const placementSelectedState = selectPlacementCandidate(
    openPlacementOrder(demandPublishedState, "order-seoul-east-mall"),
    "candidate-minsu-lee"
  );
  const placementOverrideState = enablePlacementOverride(
    placementSelectedState,
    "Ops manager approved one supervised first shift while the medical clearance renewal completes."
  );
  const placementCommittedState = commitSelectedPlacement(placementOverrideState, {
    committedAt: "2026-04-08T10:15:00+09:00",
    committedBy: "Ops manager / J. Han"
  });
  const attendanceReviewState = openAttendanceRecord(placementCommittedState, "att-2");
  const attendanceApprovedState = approveAttendanceRecord(attendanceReviewState, "att-2", {
    approvedAt: "2026-04-09 08:05 KST",
    approvedBy: "Ops manager / J. Han"
  });
  const billingReadyState = openBillingDraft(attendanceApprovedState, "bill-2");

  return [
    {
      file: "admin/01-work-queue-desktop.html",
      title: "Work queue baseline (desktop)",
      description: "Baseline desktop queue for operator triage.",
      html: renderAdminDemoHtml()
    },
    {
      file: "admin/02-work-queue-mobile.html",
      title: "Work queue baseline (mobile)",
      description: "Mobile variant for site or manager review.",
      html: renderAdminDemoHtml({ viewport: "mobile" })
    },
    {
      file: "admin/03-demand-draft.html",
      title: "Demand draft with commercial blockers",
      description: "Incheon order before commercial fields are fully resolved.",
      html: renderAdminOperatorHtml(demandDraftState)
    },
    {
      file: "admin/04-demand-publish-ready.html",
      title: "Demand draft after commercial unblock",
      description: "Same order after bill rate and overtime policy are completed.",
      html: renderAdminOperatorHtml(demandReadyState)
    },
    {
      file: "admin/05-demand-published.html",
      title: "Published demand order",
      description: "Order moved from blocked draft into staffing-ready state.",
      html: renderAdminOperatorHtml(demandPublishedState)
    },
    {
      file: "admin/06-placement-selected.html",
      title: "Placement candidate selected",
      description: "Override-required candidate selected for Seoul East Mall.",
      html: renderAdminOperatorHtml(placementSelectedState)
    },
    {
      file: "admin/07-placement-override-armed.html",
      title: "Placement override armed",
      description: "Manager rationale attached so the commit can proceed.",
      html: renderAdminOperatorHtml(placementOverrideState)
    },
    {
      file: "admin/08-placement-committed.html",
      title: "Placement committed",
      description: "Override commit captured and order headcount advanced.",
      html: renderAdminOperatorHtml(placementCommittedState)
    },
    {
      file: "admin/09-attendance-review.html",
      title: "Attendance under exception review",
      description: "Finance-impacting overtime row still waiting on operator approval.",
      html: renderAdminOperatorHtml(attendanceReviewState)
    },
    {
      file: "admin/10-attendance-approved.html",
      title: "Attendance approved",
      description: "Attendance row approved and billing draft unblocked.",
      html: renderAdminOperatorHtml(attendanceApprovedState)
    },
    {
      file: "admin/11-billing-ready.html",
      title: "Billing handoff ready",
      description: "Billing draft opened after approval released the export gate.",
      html: renderAdminOperatorHtml(billingReadyState)
    }
  ];
}

function buildBundleReadme(flowSnapshots, proofFiles) {
  const flowLines = flowSnapshots
    .map((snapshot) => `- [${snapshot.title}](./${snapshot.file}): ${snapshot.description}`)
    .join("\n");
  const proofLines = proofFiles
    .map((artifact) => `- [${artifact.title}](./${artifact.file}): ${artifact.description}`)
    .join("\n");

  return `# Demo Bundle

Generated with \`pnpm demo:bundle\` after a full TypeScript build.

## Admin HTML snapshots

${flowLines}

## Pilot proof JSON

${proofLines}
`;
}

async function main() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const flowSnapshots = buildFlowSnapshots();
  for (const snapshot of flowSnapshots) {
    await writeText(snapshot.file, snapshot.html);
  }

  const proofBundle = buildDesignPartnerPilotProofBundle();
  const proofSummary = {
    fixtureId: proofBundle.fixtureId,
    environmentName: proofBundle.environmentName,
    timezone: proofBundle.timezone,
    operatorRolesUsed: proofBundle.operatorRolesUsed,
    trace: proofBundle.trace,
    billing: {
      exportBatchId: proofBundle.billing.exportArtifact.exportBatchId,
      batchKey: proofBundle.billing.exportArtifact.batchKey,
      eligibleAssignmentIds: proofBundle.billing.eligibleAssignmentIds,
      excludedAttendanceIds: proofBundle.billing.excludedAttendanceIds,
      sourceAttendanceIds: proofBundle.billing.exportArtifact.sourceAttendanceIds
    },
    permissions: {
      placementOverrideDenied: proofBundle.permissions.placementOverride.denied.errorMessage,
      attendanceCorrectionDenied: proofBundle.permissions.attendanceCorrection.denied.errorMessage,
      billingExportDenied: proofBundle.permissions.billingExport.denied.errorMessage
    }
  };

  const proofFiles = [
    {
      file: await writeJson("proof/design-partner-pilot.bundle.json", proofBundle),
      title: "Design partner pilot proof bundle",
      description: "Full pilot-reviewable proof payload with audit trails and export artifact."
    },
    {
      file: await writeJson("proof/design-partner-pilot.summary.json", proofSummary),
      title: "Design partner pilot proof summary",
      description: "Compact summary of the pilot trace, export batch, and denied role-boundary proofs."
    }
  ];

  const manifest = {
    command: "pnpm demo:bundle",
    outputDirectory: "artifacts/demo-bundle",
    flowSnapshots: flowSnapshots.map(({ file, title, description }) => ({
      file,
      title,
      description
    })),
    proofFiles
  };

  await writeJson("manifest.json", manifest);
  await writeText("README.md", buildBundleReadme(flowSnapshots, proofFiles));

  console.log(`Demo bundle written to ${path.relative(rootDir, outputDir)}`);
  for (const file of [
    ...flowSnapshots.map((snapshot) => snapshot.file),
    ...proofFiles.map((artifact) => artifact.file),
    "manifest.json",
    "README.md"
  ]) {
    console.log(`- ${file}`);
  }
}

await main();

import { coreModules, systemProfile, type AssignmentSnapshot } from "@staffing-ops/domain";

export const apiServiceManifest = {
  service: "staffing-ops-api",
  runtime: "node",
  timezone: systemProfile.timezone,
  currency: systemProfile.currency,
  ownedModules: [...coreModules]
} as const;

export function formatAssignmentAuditKey(snapshot: AssignmentSnapshot): string {
  return `${snapshot.orderId}:${snapshot.workerId}:${snapshot.effectiveDate}`;
}

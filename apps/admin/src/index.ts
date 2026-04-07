import { coreModules, systemProfile } from "@staffing-ops/domain";

export const adminShellManifest = {
  application: "staffing-ops-admin",
  targetPersona: systemProfile.primaryPersona,
  defaultTimezone: systemProfile.timezone,
  defaultCurrency: systemProfile.currency,
  firstWorkflow: "client order intake -> placement -> attendance -> invoice handoff",
  navigation: [
    "orders",
    "placements",
    "attendance",
    "billing",
    "compliance"
  ],
  sharedModulesLoaded: coreModules.length
} as const;

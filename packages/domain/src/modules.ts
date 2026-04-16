export const coreModules = [
  "crm_accounts",
  "order_intake",
  "worker_registry",
  "placement",
  "attendance",
  "billing",
  "compliance",
  "documents",
  "audit",
  "integration_outbox"
] as const;

export type CoreModule = (typeof coreModules)[number];

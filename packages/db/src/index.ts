export const staffingCoreTables = [
  "organizations",
  "operator_users",
  "client_accounts",
  "sites",
  "orders",
  "workers",
  "assignments",
  "attendance",
  "billing_handoff_batches",
  "document_files",
  "audit_events",
  "outbox_jobs"
] as const;

export const moduleTableOwnership = {
  shared: ["organizations", "operator_users"],
  crm_accounts: ["client_accounts", "sites"],
  order_intake: ["orders"],
  worker_registry: ["workers"],
  placement: ["assignments"],
  attendance: ["attendance"],
  billing: ["billing_handoff_batches"],
  documents: ["document_files"],
  audit: ["audit_events"],
  integration_outbox: ["outbox_jobs"]
} as const;

export const staffingDbManifest = {
  package: "@staffing-ops/db",
  dialect: "postgres",
  migrationFiles: ["0001_initial_staffing_ops.sql", "0002_billing_handoff_batches.sql"],
  coreTables: [...staffingCoreTables],
  moduleTableOwnership
} as const;

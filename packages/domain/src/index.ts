export const systemProfile = {
  name: "staffing-ops",
  region: "KR",
  timezone: "Asia/Seoul",
  currency: "KRW",
  primaryPersona: "Operations Coordinator"
} as const;

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

export type ServiceType = "dispatch" | "subcontracting" | "outsourcing";

export interface AssignmentSnapshotInput {
  readonly orderId: string;
  readonly workerId: string;
  readonly siteId: string;
  readonly payRateKrw: number;
  readonly billRateKrw: number;
  readonly shiftPattern: string;
  readonly effectiveDate: string;
  readonly serviceType: ServiceType;
}

export interface AssignmentSnapshot extends AssignmentSnapshotInput {
  readonly snapshotVersion: 1;
}

export function createAssignmentSnapshot(input: AssignmentSnapshotInput): AssignmentSnapshot {
  if (input.payRateKrw <= 0) {
    throw new Error("Pay rate must be positive.");
  }

  if (input.billRateKrw <= 0) {
    throw new Error("Bill rate must be positive.");
  }

  return {
    snapshotVersion: 1,
    ...input
  };
}

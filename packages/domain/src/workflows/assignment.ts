import type { Assignment, AssignmentSnapshot, AssignmentSnapshotInput } from "../entities.js";

export interface CreateAssignmentInput extends AssignmentSnapshotInput {
  readonly id: string;
  readonly organizationId: string;
  readonly clientAccountId: string;
  readonly plannedStartDate: string;
  readonly plannedEndDate: string;
  readonly sourceChannel: string;
  readonly createdAt: string;
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

export function createAssignment(input: CreateAssignmentInput): Assignment {
  if (input.plannedEndDate < input.plannedStartDate) {
    throw new Error("Assignment planned end date must be on or after the planned start date.");
  }

  if (!input.sourceChannel.trim()) {
    throw new Error("Assignment source channel is required.");
  }

  return {
    id: input.id,
    organizationId: input.organizationId,
    clientAccountId: input.clientAccountId,
    orderId: input.orderId,
    workerId: input.workerId,
    siteId: input.siteId,
    plannedStartDate: input.plannedStartDate,
    plannedEndDate: input.plannedEndDate,
    sourceChannel: input.sourceChannel,
    status: "proposed",
    snapshot: createAssignmentSnapshot(input),
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
}

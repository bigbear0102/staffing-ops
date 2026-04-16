import type { AuditEvent, CreateOutboxJobInput, OutboxJob } from "./entities.js";
import type { CoreModule } from "./modules.js";
import type { AuditEntityType } from "./entities.js";

export interface CreateAuditEventInput {
  readonly id: string;
  readonly organizationId: string;
  readonly module: CoreModule;
  readonly entityType: AuditEntityType;
  readonly entityId: string;
  readonly actorUserId: string;
  readonly action: string;
  readonly occurredAt: string;
  readonly payload: Record<string, unknown>;
}

export function createAuditEvent(input: CreateAuditEventInput): AuditEvent {
  if (!input.entityId.trim()) {
    throw new Error("Audit events must point at an entity.");
  }

  return {
    ...input
  };
}

export function createOutboxJob(input: CreateOutboxJobInput): OutboxJob {
  if (!input.dedupeKey.trim()) {
    throw new Error("Outbox jobs require a dedupe key.");
  }

  const maxAttempts = input.maxAttempts ?? 10;

  return {
    id: input.id,
    organizationId: input.organizationId,
    topic: input.topic,
    status: "pending",
    dedupeKey: input.dedupeKey,
    payload: input.payload,
    scheduledAt: input.scheduledAt,
    attempts: 0,
    maxAttempts,
    createdAt: input.scheduledAt,
    updatedAt: input.scheduledAt
  };
}

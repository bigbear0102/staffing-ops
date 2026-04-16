import type { AuditEvent, Order } from "../entities.js";
import { createAuditEvent } from "../records.js";

export interface CreateOrderInput {
  readonly id: string;
  readonly organizationId: string;
  readonly clientAccountId: string;
  readonly siteId: string;
  readonly roleCode: string;
  readonly headcountRequired: number;
  readonly requiredQualifications: readonly string[];
  readonly startDate: string;
  readonly endDate: string;
  readonly shiftPattern: string;
  readonly billRateKrw: number;
  readonly overtimeRuleCode: string;
  readonly createdAt: string;
}

export interface PublishOrderInput {
  readonly order: Order;
  readonly actorUserId: string;
  readonly auditEventId: string;
  readonly publishedAt: string;
}

export interface PublishOrderResult {
  readonly order: Order;
  readonly auditEvent: AuditEvent;
}

export function createOrder(input: CreateOrderInput): Order {
  if (input.headcountRequired <= 0) {
    throw new Error("Order headcount must be positive.");
  }

  if (input.billRateKrw <= 0) {
    throw new Error("Order bill rate must be positive.");
  }

  if (input.endDate < input.startDate) {
    throw new Error("Order end date must be on or after the start date.");
  }

  if (!input.shiftPattern.trim()) {
    throw new Error("Order shift pattern is required.");
  }

  if (!input.overtimeRuleCode.trim()) {
    throw new Error("Order overtime rule is required.");
  }

  return {
    id: input.id,
    organizationId: input.organizationId,
    clientAccountId: input.clientAccountId,
    siteId: input.siteId,
    roleCode: input.roleCode,
    headcountRequired: input.headcountRequired,
    requiredQualifications: [...input.requiredQualifications],
    slotsFilled: 0,
    startDate: input.startDate,
    endDate: input.endDate,
    shiftPattern: input.shiftPattern,
    billRateKrw: input.billRateKrw,
    overtimeRuleCode: input.overtimeRuleCode,
    status: "draft",
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
}

export function publishOrder(input: PublishOrderInput): PublishOrderResult {
  if (input.order.status !== "draft") {
    throw new Error("Only draft orders can be published.");
  }

  if (input.order.requiredQualifications.length === 0) {
    throw new Error("Orders must declare at least one required qualification before publish.");
  }

  const order: Order = {
    ...input.order,
    status: "open",
    updatedAt: input.publishedAt
  };

  return {
    order,
    auditEvent: createAuditEvent({
      id: input.auditEventId,
      organizationId: input.order.organizationId,
      module: "order_intake",
      entityType: "order",
      entityId: input.order.id,
      actorUserId: input.actorUserId,
      action: "order.published",
      occurredAt: input.publishedAt,
      payload: {
        before: {
          status: input.order.status,
          slotsFilled: input.order.slotsFilled
        },
        after: {
          status: order.status,
          slotsFilled: order.slotsFilled
        },
        requiredQualifications: [...order.requiredQualifications]
      }
    })
  };
}

export function applyAssignmentToOrder(order: Order, committedAt: string): Order {
  if (order.status !== "open" && order.status !== "partially_filled") {
    throw new Error("Assignments can only be committed against open or partially filled orders.");
  }

  if (order.slotsFilled >= order.headcountRequired) {
    throw new Error("Order already has all required slots filled.");
  }

  const slotsFilled = order.slotsFilled + 1;

  return {
    ...order,
    slotsFilled,
    status: slotsFilled >= order.headcountRequired ? "filled" : "partially_filled",
    updatedAt: committedAt
  };
}

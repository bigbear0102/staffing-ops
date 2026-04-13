import type { AuditEntityType, AuditEvent, OperatorRole } from "./entities.js";
import type { CoreModule } from "./modules.js";
import { createAuditEvent } from "./records.js";

export type RoleBoundaryAction =
  | "placement_override"
  | "attendance_correction"
  | "billing_export";

export interface RoleBoundaryActor {
  readonly userId: string;
  readonly role: OperatorRole;
}

interface RoleBoundaryPolicy {
  readonly module: CoreModule;
  readonly actionLabel: string;
  readonly allowedRoles: readonly OperatorRole[];
}

const roleBoundaryPolicies = {
  placement_override: {
    module: "placement",
    actionLabel: "placement.override",
    allowedRoles: ["admin", "operations_manager"]
  },
  attendance_correction: {
    module: "attendance",
    actionLabel: "attendance.correction",
    allowedRoles: ["admin", "operations_manager", "operations_operator"]
  },
  billing_export: {
    module: "billing",
    actionLabel: "billing.finance_handoff_export",
    allowedRoles: ["admin", "operations_manager", "finance_admin"]
  }
} as const satisfies Record<RoleBoundaryAction, RoleBoundaryPolicy>;

export interface AuthorizeRoleBoundaryInput {
  readonly organizationId: string;
  readonly action: RoleBoundaryAction;
  readonly actor: RoleBoundaryActor;
  readonly auditEventId: string;
  readonly occurredAt: string;
  readonly entityType: AuditEntityType;
  readonly entityId: string;
  readonly context?: Record<string, unknown>;
}

export class RoleBoundaryAuthorizationError extends Error {
  readonly auditEvent: AuditEvent;
  readonly action: RoleBoundaryAction;
  readonly actorRole: OperatorRole;

  constructor(
    message: string,
    options: {
      readonly auditEvent: AuditEvent;
      readonly action: RoleBoundaryAction;
      readonly actorRole: OperatorRole;
    }
  ) {
    super(message);
    this.name = "RoleBoundaryAuthorizationError";
    this.auditEvent = options.auditEvent;
    this.action = options.action;
    this.actorRole = options.actorRole;
  }
}

export function getAllowedRolesForAction(
  action: RoleBoundaryAction
): readonly OperatorRole[] {
  return [...roleBoundaryPolicies[action].allowedRoles];
}

export function canRolePerformAction(
  role: OperatorRole,
  action: RoleBoundaryAction
): boolean {
  const allowedRoles: readonly OperatorRole[] = roleBoundaryPolicies[action].allowedRoles;
  return allowedRoles.includes(role);
}

export function authorizeRoleBoundary(input: AuthorizeRoleBoundaryInput): AuditEvent {
  const policy = roleBoundaryPolicies[input.action];
  const authorized = canRolePerformAction(input.actor.role, input.action);
  const denialReason = authorized
    ? undefined
    : `Role ${input.actor.role} cannot perform ${policy.actionLabel}. Allowed roles: ${policy.allowedRoles.join(", ")}.`;

  const auditEvent = createAuditEvent({
    id: input.auditEventId,
    organizationId: input.organizationId,
    module: policy.module,
    entityType: input.entityType,
    entityId: input.entityId,
    actorUserId: input.actor.userId,
    action: `${policy.actionLabel}_${authorized ? "authorized" : "denied"}`,
    occurredAt: input.occurredAt,
    payload: {
      roleBoundaryAction: input.action,
      decision: authorized ? "authorized" : "denied",
      actorRole: input.actor.role,
      allowedRoles: [...policy.allowedRoles],
      ...(denialReason ? { denialReason } : {}),
      ...(input.context ? { context: input.context } : {})
    }
  });

  if (!authorized) {
    throw new RoleBoundaryAuthorizationError(denialReason!, {
      auditEvent,
      action: input.action,
      actorRole: input.actor.role
    });
  }

  return auditEvent;
}

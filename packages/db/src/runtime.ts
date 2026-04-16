import type {
  Assignment,
  Attendance,
  AuditEntityType,
  AuditEvent,
  BillingExportFormat,
  BillingHandoffAssignmentSnapshot,
  BillingHandoffExportArtifact,
  BillingHandoffRequest,
  ClientAccount,
  OperatorRole,
  Order,
  OutboxJob,
  Site,
  Worker
} from "@staffing-ops/domain";

export interface OrganizationRecord {
  readonly id: string;
  readonly name: string;
  readonly countryCode: string;
  readonly timezone: string;
  readonly currencyCode: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OperatorUserRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: OperatorRole;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BillingHandoffBatchRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly clientAccountId: string;
  readonly siteId: string;
  readonly batchKey: string;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
  readonly exportFormat: BillingExportFormat;
  readonly generatedAt: string;
  readonly generatedByUserId: string;
  readonly sourceAttendanceIds: readonly string[];
  readonly sourceAssignmentSnapshots: readonly BillingHandoffAssignmentSnapshot[];
  readonly artifactPayload: BillingHandoffExportArtifact;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SeedStaffingPersistenceInput {
  readonly organizations?: readonly OrganizationRecord[];
  readonly operatorUsers?: readonly OperatorUserRecord[];
  readonly clientAccounts?: readonly ClientAccount[];
  readonly sites?: readonly Site[];
  readonly workers?: readonly Worker[];
  readonly orders?: readonly Order[];
  readonly assignments?: readonly Assignment[];
  readonly attendance?: readonly Attendance[];
  readonly billingHandoffRequests?: readonly BillingHandoffRequest[];
  readonly billingHandoffBatches?: readonly BillingHandoffBatchRecord[];
  readonly auditEvents?: readonly AuditEvent[];
  readonly outboxJobs?: readonly OutboxJob[];
}

export interface StaffingPersistenceSnapshot {
  readonly organizations: readonly OrganizationRecord[];
  readonly operatorUsers: readonly OperatorUserRecord[];
  readonly clientAccounts: readonly ClientAccount[];
  readonly sites: readonly Site[];
  readonly workers: readonly Worker[];
  readonly orders: readonly Order[];
  readonly assignments: readonly Assignment[];
  readonly attendance: readonly Attendance[];
  readonly billingHandoffRequests: readonly BillingHandoffRequest[];
  readonly billingHandoffBatches: readonly BillingHandoffBatchRecord[];
  readonly auditEvents: readonly AuditEvent[];
  readonly outboxJobs: readonly OutboxJob[];
}

export class PersistenceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceConflictError";
  }
}

export class PersistenceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceNotFoundError";
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function ensureForeignRecord(
  exists: boolean,
  message: string
): void {
  if (!exists) {
    throw new PersistenceNotFoundError(message);
  }
}

function sortByUpdatedAt<T extends { readonly updatedAt: string }>(records: readonly T[]): readonly T[] {
  return [...records].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
}

export function createBillingHandoffBatchRecord(
  artifact: BillingHandoffExportArtifact
): BillingHandoffBatchRecord {
  return {
    id: artifact.exportBatchId,
    organizationId: artifact.organizationId,
    clientAccountId: artifact.clientAccountId,
    siteId: artifact.siteId,
    batchKey: artifact.batchKey,
    billingPeriodStart: artifact.billingPeriodStart,
    billingPeriodEnd: artifact.billingPeriodEnd,
    exportFormat: artifact.format,
    generatedAt: artifact.generatedAt,
    generatedByUserId: artifact.generatedByUserId,
    sourceAttendanceIds: [...artifact.sourceAttendanceIds],
    sourceAssignmentSnapshots: [...artifact.sourceAssignmentSnapshots],
    artifactPayload: clone(artifact),
    createdAt: artifact.generatedAt,
    updatedAt: artifact.generatedAt
  };
}

export interface StaffingPersistence {
  seed(input: SeedStaffingPersistenceInput): void;
  putOrganization(record: OrganizationRecord): OrganizationRecord;
  putOperatorUser(record: OperatorUserRecord): OperatorUserRecord;
  putClientAccount(record: ClientAccount): ClientAccount;
  putSite(record: Site): Site;
  putWorker(record: Worker): Worker;
  putOrder(record: Order): Order;
  putAssignment(record: Assignment): Assignment;
  putAttendance(record: Attendance): Attendance;
  putBillingHandoffRequest(record: BillingHandoffRequest): BillingHandoffRequest;
  markBillingHandoffRequestsExported(
    requestIds: readonly string[],
    exportBatchId: string,
    exportedAt: string
  ): readonly BillingHandoffRequest[];
  putBillingHandoffBatch(record: BillingHandoffBatchRecord): BillingHandoffBatchRecord;
  appendAuditEvent(record: AuditEvent): AuditEvent;
  putOutboxJob(record: OutboxJob): OutboxJob;
  getOperatorUser(id: string): OperatorUserRecord | undefined;
  getWorker(id: string): Worker | undefined;
  getOrder(id: string): Order | undefined;
  getAssignment(id: string): Assignment | undefined;
  getAttendance(id: string): Attendance | undefined;
  getBillingHandoffRequest(id: string): BillingHandoffRequest | undefined;
  listBillingHandoffRequests(ids?: readonly string[]): readonly BillingHandoffRequest[];
  listAuditEvents(entityType?: AuditEntityType, entityId?: string): readonly AuditEvent[];
  listOutboxJobs(): readonly OutboxJob[];
  snapshot(): StaffingPersistenceSnapshot;
}

export function createInMemoryStaffingPersistence(): StaffingPersistence {
  const organizations = new Map<string, OrganizationRecord>();
  const operatorUsers = new Map<string, OperatorUserRecord>();
  const clientAccounts = new Map<string, ClientAccount>();
  const sites = new Map<string, Site>();
  const workers = new Map<string, Worker>();
  const orders = new Map<string, Order>();
  const assignments = new Map<string, Assignment>();
  const attendance = new Map<string, Attendance>();
  const attendanceByAssignmentDay = new Map<string, string>();
  const billingHandoffRequests = new Map<string, BillingHandoffRequest>();
  const billingHandoffRequestIdsByAttendance = new Map<string, string>();
  const billingHandoffBatches = new Map<string, BillingHandoffBatchRecord>();
  const billingHandoffBatchIdsByKey = new Map<string, string>();
  const auditEvents = new Map<string, AuditEvent>();
  const auditTimeline: string[] = [];
  const outboxJobs = new Map<string, OutboxJob>();
  const outboxJobIdsByDedupeKey = new Map<string, string>();

  function putOrganization(record: OrganizationRecord): OrganizationRecord {
    organizations.set(record.id, clone(record));
    return clone(record);
  }

  function putOperatorUser(record: OperatorUserRecord): OperatorUserRecord {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );
    operatorUsers.set(record.id, clone(record));
    return clone(record);
  }

  function putClientAccount(record: ClientAccount): ClientAccount {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );
    ensureForeignRecord(
      operatorUsers.has(record.ownerUserId),
      `Operator user ${record.ownerUserId} does not exist.`
    );
    clientAccounts.set(record.id, clone(record));
    return clone(record);
  }

  function putSite(record: Site): Site {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );
    ensureForeignRecord(
      clientAccounts.has(record.clientAccountId),
      `Client account ${record.clientAccountId} does not exist.`
    );
    sites.set(record.id, clone(record));
    return clone(record);
  }

  function putWorker(record: Worker): Worker {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );
    workers.set(record.id, clone(record));
    return clone(record);
  }

  function putOrder(record: Order): Order {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );
    ensureForeignRecord(
      clientAccounts.has(record.clientAccountId),
      `Client account ${record.clientAccountId} does not exist.`
    );
    ensureForeignRecord(
      sites.has(record.siteId),
      `Site ${record.siteId} does not exist.`
    );
    orders.set(record.id, clone(record));
    return clone(record);
  }

  function putAssignment(record: Assignment): Assignment {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );
    ensureForeignRecord(
      clientAccounts.has(record.clientAccountId),
      `Client account ${record.clientAccountId} does not exist.`
    );
    ensureForeignRecord(
      orders.has(record.orderId),
      `Order ${record.orderId} does not exist.`
    );
    ensureForeignRecord(
      workers.has(record.workerId),
      `Worker ${record.workerId} does not exist.`
    );
    ensureForeignRecord(
      sites.has(record.siteId),
      `Site ${record.siteId} does not exist.`
    );

    const existing = assignments.get(record.id);

    if (existing && JSON.stringify(existing.snapshot) !== JSON.stringify(record.snapshot)) {
      throw new PersistenceConflictError(
        `Assignment ${record.id} cannot overwrite its persisted snapshot.`
      );
    }

    assignments.set(record.id, clone(record));
    return clone(record);
  }

  function putAttendance(record: Attendance): Attendance {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );
    ensureForeignRecord(
      assignments.has(record.assignmentId),
      `Assignment ${record.assignmentId} does not exist.`
    );

    const uniqueKey = `${record.assignmentId}:${record.workDate}`;
    const existingId = attendanceByAssignmentDay.get(uniqueKey);

    if (existingId && existingId !== record.id) {
      throw new PersistenceConflictError(
        `Attendance for assignment ${record.assignmentId} and work date ${record.workDate} already exists.`
      );
    }

    attendance.set(record.id, clone(record));
    attendanceByAssignmentDay.set(uniqueKey, record.id);
    return clone(record);
  }

  function putBillingHandoffRequest(record: BillingHandoffRequest): BillingHandoffRequest {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );
    ensureForeignRecord(
      clientAccounts.has(record.clientAccountId),
      `Client account ${record.clientAccountId} does not exist.`
    );
    ensureForeignRecord(
      sites.has(record.siteId),
      `Site ${record.siteId} does not exist.`
    );
    ensureForeignRecord(
      workers.has(record.workerId),
      `Worker ${record.workerId} does not exist.`
    );
    ensureForeignRecord(
      assignments.has(record.sourceAssignmentId),
      `Assignment ${record.sourceAssignmentId} does not exist.`
    );
    ensureForeignRecord(
      attendance.has(record.sourceAttendanceId),
      `Attendance ${record.sourceAttendanceId} does not exist.`
    );

    const existingId = billingHandoffRequestIdsByAttendance.get(record.sourceAttendanceId);
    const existing = existingId ? billingHandoffRequests.get(existingId) : undefined;

    if (existing && existing.id !== record.id) {
      throw new PersistenceConflictError(
        `Attendance ${record.sourceAttendanceId} already has billing handoff request ${existing.id}.`
      );
    }

    const persisted: BillingHandoffRequest = existing
      ? {
          ...clone(record),
          id: existing.id,
          createdAt: existing.createdAt
        }
      : clone(record);

    billingHandoffRequests.set(persisted.id, persisted);
    billingHandoffRequestIdsByAttendance.set(persisted.sourceAttendanceId, persisted.id);
    return clone(persisted);
  }

  function markBillingHandoffRequestsExported(
    requestIds: readonly string[],
    exportBatchId: string,
    exportedAt: string
  ): readonly BillingHandoffRequest[] {
    return requestIds.map((requestId) => {
      const existing = billingHandoffRequests.get(requestId);

      if (!existing) {
        throw new PersistenceNotFoundError(`Billing handoff request ${requestId} does not exist.`);
      }

      const updated: BillingHandoffRequest = {
        ...existing,
        status: "exported",
        exportBatchId,
        updatedAt: exportedAt
      };

      billingHandoffRequests.set(requestId, updated);
      return clone(updated);
    });
  }

  function putBillingHandoffBatch(record: BillingHandoffBatchRecord): BillingHandoffBatchRecord {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );
    ensureForeignRecord(
      clientAccounts.has(record.clientAccountId),
      `Client account ${record.clientAccountId} does not exist.`
    );
    ensureForeignRecord(
      sites.has(record.siteId),
      `Site ${record.siteId} does not exist.`
    );
    ensureForeignRecord(
      operatorUsers.has(record.generatedByUserId),
      `Operator user ${record.generatedByUserId} does not exist.`
    );

    const existingId = billingHandoffBatchIdsByKey.get(record.batchKey);

    if (existingId && existingId !== record.id) {
      throw new PersistenceConflictError(
        `Billing handoff batch key ${record.batchKey} is already in use.`
      );
    }

    billingHandoffBatches.set(record.id, clone(record));
    billingHandoffBatchIdsByKey.set(record.batchKey, record.id);
    return clone(record);
  }

  function appendAuditEvent(record: AuditEvent): AuditEvent {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );
    ensureForeignRecord(
      operatorUsers.has(record.actorUserId),
      `Operator user ${record.actorUserId} does not exist.`
    );

    if (!auditEvents.has(record.id)) {
      auditTimeline.push(record.id);
    }

    auditEvents.set(record.id, clone(record));
    return clone(record);
  }

  function putOutboxJob(record: OutboxJob): OutboxJob {
    ensureForeignRecord(
      organizations.has(record.organizationId),
      `Organization ${record.organizationId} does not exist.`
    );

    const dedupeKey = `${record.organizationId}:${record.dedupeKey}`;
    const existingId = outboxJobIdsByDedupeKey.get(dedupeKey);
    const existing = existingId ? outboxJobs.get(existingId) : undefined;
    const persisted: OutboxJob = existing
      ? {
          ...clone(record),
          id: existing.id,
          createdAt: existing.createdAt
        }
      : clone(record);

    outboxJobs.set(persisted.id, persisted);
    outboxJobIdsByDedupeKey.set(dedupeKey, persisted.id);
    return clone(persisted);
  }

  function getOperatorUser(id: string): OperatorUserRecord | undefined {
    const record = operatorUsers.get(id);
    return record ? clone(record) : undefined;
  }

  function getWorker(id: string): Worker | undefined {
    const record = workers.get(id);
    return record ? clone(record) : undefined;
  }

  function getOrder(id: string): Order | undefined {
    const record = orders.get(id);
    return record ? clone(record) : undefined;
  }

  function getAssignment(id: string): Assignment | undefined {
    const record = assignments.get(id);
    return record ? clone(record) : undefined;
  }

  function getAttendance(id: string): Attendance | undefined {
    const record = attendance.get(id);
    return record ? clone(record) : undefined;
  }

  function getBillingHandoffRequest(id: string): BillingHandoffRequest | undefined {
    const record = billingHandoffRequests.get(id);
    return record ? clone(record) : undefined;
  }

  function listBillingHandoffRequests(ids?: readonly string[]): readonly BillingHandoffRequest[] {
    const records = ids
      ? ids.flatMap((id) => {
          const record = billingHandoffRequests.get(id);
          return record ? [record] : [];
        })
      : [...billingHandoffRequests.values()];

    return sortByUpdatedAt(records).map((record) => clone(record));
  }

  function listAuditEvents(
    entityType?: AuditEntityType,
    entityId?: string
  ): readonly AuditEvent[] {
    const records = auditTimeline
      .map((id) => auditEvents.get(id))
      .flatMap((record) => (record ? [record] : []))
      .filter((record) => {
        if (entityType && record.entityType !== entityType) {
          return false;
        }

        if (entityId && record.entityId !== entityId) {
          return false;
        }

        return true;
      });

    return records.map((record) => clone(record));
  }

  function listOutboxJobs(): readonly OutboxJob[] {
    return sortByUpdatedAt([...outboxJobs.values()]).map((record) => clone(record));
  }

  function snapshot(): StaffingPersistenceSnapshot {
    return {
      organizations: sortByUpdatedAt([...organizations.values()]).map((record) => clone(record)),
      operatorUsers: sortByUpdatedAt([...operatorUsers.values()]).map((record) => clone(record)),
      clientAccounts: sortByUpdatedAt([...clientAccounts.values()]).map((record) => clone(record)),
      sites: sortByUpdatedAt([...sites.values()]).map((record) => clone(record)),
      workers: sortByUpdatedAt([...workers.values()]).map((record) => clone(record)),
      orders: sortByUpdatedAt([...orders.values()]).map((record) => clone(record)),
      assignments: sortByUpdatedAt([...assignments.values()]).map((record) => clone(record)),
      attendance: sortByUpdatedAt([...attendance.values()]).map((record) => clone(record)),
      billingHandoffRequests: listBillingHandoffRequests(),
      billingHandoffBatches: sortByUpdatedAt([...billingHandoffBatches.values()]).map((record) =>
        clone(record)
      ),
      auditEvents: listAuditEvents(),
      outboxJobs: listOutboxJobs()
    };
  }

  function seed(input: SeedStaffingPersistenceInput): void {
    for (const record of input.organizations ?? []) {
      putOrganization(record);
    }

    for (const record of input.operatorUsers ?? []) {
      putOperatorUser(record);
    }

    for (const record of input.clientAccounts ?? []) {
      putClientAccount(record);
    }

    for (const record of input.sites ?? []) {
      putSite(record);
    }

    for (const record of input.workers ?? []) {
      putWorker(record);
    }

    for (const record of input.orders ?? []) {
      putOrder(record);
    }

    for (const record of input.assignments ?? []) {
      putAssignment(record);
    }

    for (const record of input.attendance ?? []) {
      putAttendance(record);
    }

    for (const record of input.billingHandoffRequests ?? []) {
      putBillingHandoffRequest(record);
    }

    for (const record of input.billingHandoffBatches ?? []) {
      putBillingHandoffBatch(record);
    }

    for (const record of input.auditEvents ?? []) {
      appendAuditEvent(record);
    }

    for (const record of input.outboxJobs ?? []) {
      putOutboxJob(record);
    }
  }

  return {
    seed,
    putOrganization,
    putOperatorUser,
    putClientAccount,
    putSite,
    putWorker,
    putOrder,
    putAssignment,
    putAttendance,
    putBillingHandoffRequest,
    markBillingHandoffRequestsExported,
    putBillingHandoffBatch,
    appendAuditEvent,
    putOutboxJob,
    getOperatorUser,
    getWorker,
    getOrder,
    getAssignment,
    getAttendance,
    getBillingHandoffRequest,
    listBillingHandoffRequests,
    listAuditEvents,
    listOutboxJobs,
    snapshot
  };
}

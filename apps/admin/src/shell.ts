import {
  assignmentStatusDescriptors,
  attendanceStatusDescriptors,
  billingStatusDescriptors,
  buildQueueSummaryCards,
  demoOperatorDataset,
  formatCurrencyKrw,
  orderStatusDescriptors,
  readinessDescriptors,
  systemProfile,
  type AttendanceRecord,
  type BillingDraftRecord,
  type OperatorDashboardDataset,
  type PlacementCandidateRecord,
  type QueueSummaryCard,
  type SurfaceTone,
  type WorkQueueItem
} from "@staffing-ops/domain";

export type AdminRouteId =
  | "work-queue"
  | "demand"
  | "placement"
  | "attendance"
  | "billing"
  | "site-lead-roster";

export type AdminViewport = "desktop" | "mobile";

export interface AdminNavigationItem {
  readonly id: AdminRouteId;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
}

export interface AdminHeader {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly scopeLabel: string;
  readonly quickActions: readonly string[];
}

export interface WorkQueueGroup {
  readonly label: string;
  readonly items: readonly WorkQueueItem[];
}

export interface WorkQueueScreen {
  readonly kind: "work-queue";
  readonly title: string;
  readonly subtitle: string;
  readonly summaryCards: readonly QueueSummaryCard[];
  readonly groups: readonly WorkQueueGroup[];
  readonly alerts: OperatorDashboardDataset["alerts"];
}

export interface ClientSiteNode {
  readonly clientName: string;
  readonly sites: readonly {
    readonly siteName: string;
    readonly openOrders: number;
  }[];
}

export interface IntakeSection {
  readonly title: string;
  readonly state: "Complete" | "Blocked";
  readonly bullets: readonly string[];
}

export interface PlacementDecisionState {
  readonly canCommit: boolean;
  readonly requiresOverride: boolean;
  readonly overrideEnabled: boolean;
  readonly overrideReason: string | null;
  readonly blockerLabel: string;
  readonly actionLabel: string;
  readonly blockerDetails: readonly string[];
}

export interface PlacementCommitRecord {
  readonly orderId: string;
  readonly candidateId: string;
  readonly candidateName: string;
  readonly assignmentId: string;
  readonly committedAt: string;
  readonly committedBy: string;
  readonly mode: "standard" | "override";
  readonly overrideReason: string | null;
  readonly remainingHeadcount: number;
  readonly orderStatusLabel: string;
}

export interface DemandScreen {
  readonly kind: "demand";
  readonly title: string;
  readonly subtitle: string;
  readonly navigator: readonly ClientSiteNode[];
  readonly orders: OperatorDashboardDataset["orders"];
  readonly selectedOrder: OperatorDashboardDataset["orders"][number];
  readonly editorOrder: OperatorDashboardDataset["orders"][number];
  readonly intakeSections: readonly IntakeSection[];
  readonly editorBlockers: readonly string[];
  readonly editorPrimaryAction: string;
  readonly editorIsPublishReady: boolean;
}

export interface PlacementScreen {
  readonly kind: "placement";
  readonly title: string;
  readonly subtitle: string;
  readonly order: OperatorDashboardDataset["orders"][number];
  readonly openHeadcount: number;
  readonly candidates: readonly PlacementCandidateRecord[];
  readonly selectedCandidate: PlacementCandidateRecord;
  readonly decisionState: PlacementDecisionState;
  readonly commitChecklist: readonly string[];
  readonly lastCommittedAssignment: PlacementCommitRecord | null;
}

export interface AttendanceScreen {
  readonly kind: "attendance";
  readonly title: string;
  readonly subtitle: string;
  readonly filters: readonly string[];
  readonly bulkActionLabel: string;
  readonly rows: readonly AttendanceRecord[];
  readonly selectedRecord: AttendanceRecord;
}

export interface BillingScreen {
  readonly kind: "billing";
  readonly title: string;
  readonly subtitle: string;
  readonly billingPeriod: string;
  readonly drafts: readonly BillingDraftRecord[];
  readonly selectedDraft: BillingDraftRecord;
}

export interface SiteLeadRosterScreen {
  readonly kind: "site-lead-roster";
  readonly title: string;
  readonly subtitle: string;
  readonly siteName: string;
  readonly shiftDate: string;
  readonly leadName: string;
  readonly shifts: OperatorDashboardDataset["siteLeadRoster"]["shifts"];
}

export interface AdminScreens {
  readonly workQueue: WorkQueueScreen;
  readonly demand: DemandScreen;
  readonly placement: PlacementScreen;
  readonly attendance: AttendanceScreen;
  readonly billing: BillingScreen;
  readonly siteLeadRoster: SiteLeadRosterScreen;
}

export interface AdminShellState {
  readonly application: "staffing-ops-admin";
  readonly targetPersona: string;
  readonly defaultTimezone: string;
  readonly defaultCurrency: string;
  readonly header: AdminHeader;
  readonly navigation: readonly AdminNavigationItem[];
  readonly viewport: AdminViewport;
  readonly activeRoute: AdminRouteId;
  readonly screens: AdminScreens;
}

export interface CreateAdminShellOptions {
  readonly routeId?: AdminRouteId;
  readonly viewport?: AdminViewport;
  readonly dataset?: OperatorDashboardDataset;
  readonly selectedOrderId?: string;
  readonly editorOrderId?: string;
  readonly placementOrderId?: string;
  readonly selectedCandidateId?: string;
  readonly selectedAttendanceId?: string;
  readonly selectedBillingDraftId?: string;
  readonly placementDecisionState?: PlacementDecisionState;
  readonly lastPlacementCommit?: PlacementCommitRecord | null;
}

const navigationItems = [
  {
    id: "work-queue",
    label: "Work Queue",
    shortLabel: "Queue",
    description: "Queue-first control tower for blockers, SLAs, and next actions."
  },
  {
    id: "demand",
    label: "Demand",
    shortLabel: "Demand",
    description: "Client, site, and order intake workspace."
  },
  {
    id: "placement",
    label: "Placement",
    shortLabel: "Placement",
    description: "Compare candidates and commit assignment snapshots."
  },
  {
    id: "attendance",
    label: "Attendance",
    shortLabel: "Attendance",
    description: "Approve clean rows fast and resolve exceptions inline."
  },
  {
    id: "billing",
    label: "Billing",
    shortLabel: "Billing",
    description: "Invoice handoff queue with trace-back to attendance."
  },
  {
    id: "site-lead-roster",
    label: "Site Lead Roster",
    shortLabel: "Roster",
    description: "Mobile-first day-of roster for attendance, exception, and evidence entry."
  }
] as const satisfies readonly AdminNavigationItem[];

function getRequiredItem<T extends { readonly id: string }>(
  items: readonly T[],
  id: string
): T {
  const match = items.find((item) => item.id === id);

  if (!match) {
    throw new Error(`Expected demo item '${id}' to exist.`);
  }

  return match;
}

function groupWorkQueues(items: readonly WorkQueueItem[]): readonly WorkQueueGroup[] {
  return [
    "Needs staffing",
    "Compliance missing",
    "Attendance exceptions",
    "Ready for invoice handoff"
  ].map((label) => ({
    label,
    items: items.filter((item) => item.queue === label)
  }));
}

function buildNavigator(
  dataset: OperatorDashboardDataset
): readonly ClientSiteNode[] {
  const byClient = new Map<string, Map<string, number>>();

  for (const order of dataset.orders) {
    const clientSites = byClient.get(order.clientName) ?? new Map<string, number>();
    const existingCount = clientSites.get(order.siteName) ?? 0;
    clientSites.set(order.siteName, existingCount + 1);
    byClient.set(order.clientName, clientSites);
  }

  return [...byClient.entries()].map(([clientName, sites]) => ({
    clientName,
    sites: [...sites.entries()].map(([siteName, openOrders]) => ({
      siteName,
      openOrders
    }))
  }));
}

function getCommercialBlockers(
  order: OperatorDashboardDataset["orders"][number]
): readonly string[] {
  const blockers: string[] = [];

  if (order.billRateKrw === null) {
    blockers.push("Bill rate is still missing.");
  }

  if (order.overtimeRule === null || order.overtimeRule.trim().length === 0) {
    blockers.push("Overtime rule still needs an explicit value.");
  }

  return blockers;
}

function isOrderPublishReady(order: OperatorDashboardDataset["orders"][number]): boolean {
  return getCommercialBlockers(order).length === 0;
}

function buildIntakeSections(
  editorOrder: OperatorDashboardDataset["orders"][number]
): readonly IntakeSection[] {
  const publishReady = isOrderPublishReady(editorOrder);
  const commercialBlockers = getCommercialBlockers(editorOrder);

  return [
    {
      title: "Client and site",
      state: "Complete",
      bullets: [
        `Client: ${editorOrder.clientName}`,
        `Site: ${editorOrder.siteName}`,
        `Evidence source: ${editorOrder.evidenceLinkLabel}`
      ]
    },
    {
      title: "Role and staffing need",
      state: "Complete",
      bullets: [
        `Role: ${editorOrder.role}`,
        `Headcount: ${String(editorOrder.headcount)}`,
        `Service type: ${editorOrder.serviceType}`
      ]
    },
    {
      title: "Schedule and approval route",
      state: "Complete",
      bullets: [
        `Date range: ${editorOrder.dateRange}`,
        `Shift pattern: ${editorOrder.shiftPattern}`,
        `Attendance approval: ${editorOrder.attendanceApprovalMethod}`
      ]
    },
    {
      title: "Rate and overtime rules",
      state: publishReady ? "Complete" : "Blocked",
      bullets: [
        `Bill rate: ${formatCurrencyKrw(editorOrder.billRateKrw)}`,
        `Overtime rule: ${editorOrder.overtimeRule ?? "Pending confirmation"}`,
        publishReady
          ? "Commercial release gate is cleared for staffing."
          : commercialBlockers.join(" ")
      ]
    },
    {
      title: "Review and publish",
      state: publishReady ? "Complete" : "Blocked",
      bullets: [
        "Draft can be saved without loss of context.",
        publishReady
          ? "Publish is available and will push the order into Needs staffing."
          : "Publish becomes available only when commercial blockers clear."
      ]
    }
  ] as const;
}

function buildWorkQueueScreen(dataset: OperatorDashboardDataset): WorkQueueScreen {
  return {
    kind: "work-queue",
    title: "Operator control tower",
    subtitle: "Queue-first overview across demand, staffing, attendance, and billing blockers.",
    summaryCards: buildQueueSummaryCards(dataset),
    groups: groupWorkQueues(dataset.workQueues),
    alerts: dataset.alerts
  };
}

function buildDemandScreen(
  dataset: OperatorDashboardDataset,
  options: CreateAdminShellOptions
): DemandScreen {
  const selectedOrder = getRequiredItem(
    dataset.orders,
    options.selectedOrderId ?? "order-seoul-east-mall"
  );
  const editorOrder = getRequiredItem(dataset.orders, options.editorOrderId ?? "order-incheon-cold-chain");
  const editorBlockers = getCommercialBlockers(editorOrder);
  const editorIsPublishReady = editorBlockers.length === 0;

  return {
    kind: "demand",
    title: "Demand workspace",
    subtitle: "Structured order intake on the right, active order detail in the center, client/site context on the left.",
    navigator: buildNavigator(dataset),
    orders: dataset.orders,
    selectedOrder,
    editorOrder,
    intakeSections: buildIntakeSections(editorOrder),
    editorBlockers,
    editorPrimaryAction: editorIsPublishReady ? "Publish to staffing" : "Resolve blockers",
    editorIsPublishReady
  };
}

function buildDefaultPlacementDecisionState(
  selectedCandidate: PlacementCandidateRecord
): PlacementDecisionState {
  const blockerDetails =
    selectedCandidate.readinessBadge === "Ready"
      ? []
      : selectedCandidate.riskFlags.length > 0
        ? [...selectedCandidate.riskFlags]
        : [readinessDescriptors[selectedCandidate.readinessBadge].detail];

  if (blockerDetails.length === 0) {
    return {
      canCommit: true,
      requiresOverride: false,
      overrideEnabled: false,
      overrideReason: null,
      blockerLabel: "Ready to assign",
      actionLabel: "Confirm assignment",
      blockerDetails: ["No visible blockers for this worker."]
    };
  }

  return {
    canCommit: false,
    requiresOverride: true,
    overrideEnabled: false,
    overrideReason: null,
    blockerLabel: "Commit blocked",
    actionLabel: "Override required",
    blockerDetails
  };
}

function buildPlacementChecklist(
  order: OperatorDashboardDataset["orders"][number],
  selectedCandidate: PlacementCandidateRecord,
  decisionState: PlacementDecisionState,
  lastPlacementCommit: PlacementCommitRecord | null
): readonly string[] {
  const checklist = [
    `Schedule snapshot: ${order.shiftPattern}`,
    `Bill rate snapshot: ${formatCurrencyKrw(order.billRateKrw)}`,
    `Candidate availability: ${selectedCandidate.availability}`
  ];

  if (decisionState.overrideEnabled && decisionState.overrideReason) {
    checklist.push(`Placement override reason: ${decisionState.overrideReason}`);
  }

  checklist.push(
    decisionState.canCommit
      ? "Commit is clear to proceed from this board."
      : "Commit is blocked until the operator resolves or overrides the blocker."
  );

  if (lastPlacementCommit && lastPlacementCommit.orderId === order.id) {
    checklist.push(
      `Last commit: ${lastPlacementCommit.candidateName} via ${lastPlacementCommit.mode} path.`
    );
  }

  return checklist;
}

function buildPlacementScreen(
  dataset: OperatorDashboardDataset,
  options: CreateAdminShellOptions
): PlacementScreen {
  const order = getRequiredItem(dataset.orders, options.placementOrderId ?? "order-seoul-east-mall");
  const selectedCandidate = getRequiredItem(
    dataset.placementCandidates,
    options.selectedCandidateId ?? "candidate-minsu-lee"
  );
  const decisionState =
    options.placementDecisionState ?? buildDefaultPlacementDecisionState(selectedCandidate);
  const lastCommittedAssignment = options.lastPlacementCommit ?? null;
  const openHeadcount = Math.max(order.headcount - order.filledHeadcount, 0);

  return {
    kind: "placement",
    title: "Placement board",
    subtitle: "One compare-and-decide workspace for fit, compliance, and assignment commit.",
    order,
    openHeadcount,
    candidates: dataset.placementCandidates,
    selectedCandidate,
    decisionState,
    commitChecklist: buildPlacementChecklist(
      order,
      selectedCandidate,
      decisionState,
      lastCommittedAssignment
    ),
    lastCommittedAssignment
  };
}

function buildAttendanceScreen(
  dataset: OperatorDashboardDataset,
  options: CreateAdminShellOptions
): AttendanceScreen {
  const selectedRecord = getRequiredItem(
    dataset.attendanceRecords,
    options.selectedAttendanceId ?? "att-3"
  );

  return {
    kind: "attendance",
    title: "Attendance exception queue",
    subtitle: "Planned vs actual review with typed correction reasons and preserved source values.",
    filters: [
      "Date: 2026-04-08 -> 2026-04-11",
      "Site: Suwon Assembly + Seoul East Mall",
      "Approval state: exception_pending, site_review_pending",
      "Exception type: overtime, cutoff breach"
    ],
    bulkActionLabel: "Bulk approve 1 clean row",
    rows: dataset.attendanceRecords,
    selectedRecord
  };
}

function buildBillingScreen(
  dataset: OperatorDashboardDataset,
  options: CreateAdminShellOptions
): BillingScreen {
  const selectedDraft = getRequiredItem(
    dataset.billingDrafts,
    options.selectedBillingDraftId ?? "bill-2"
  );

  return {
    kind: "billing",
    title: "Billing handoff queue",
    subtitle: "Readiness-first invoice drafting with line-item traceability back to attendance and assignment snapshots.",
    billingPeriod: "2026-04 / week 2",
    drafts: dataset.billingDrafts,
    selectedDraft
  };
}

function buildSiteLeadRosterScreen(dataset: OperatorDashboardDataset): SiteLeadRosterScreen {
  return {
    kind: "site-lead-roster",
    title: "Site lead mobile roster",
    subtitle: "Task-first mobile surface for arrivals, incident capture, and evidence logging.",
    siteName: dataset.siteLeadRoster.siteName,
    shiftDate: dataset.siteLeadRoster.shiftDate,
    leadName: dataset.siteLeadRoster.leadName,
    shifts: dataset.siteLeadRoster.shifts
  };
}

export const adminShellManifest = {
  application: "staffing-ops-admin",
  targetPersona: systemProfile.primaryPersona,
  defaultTimezone: systemProfile.timezone,
  defaultCurrency: systemProfile.currency,
  firstWorkflow: "client order intake -> placement -> attendance -> invoice handoff",
  navigation: navigationItems.map((item) => item.label),
  responsiveModes: ["desktop-operator", "mobile-site-lead"],
  seededScreens: [
    "operator-dashboard",
    "order-intake-detail",
    "placement-board",
    "attendance-exception-queue",
    "billing-handoff-queue",
    "site-lead-mobile-roster"
  ]
} as const;

export function createAdminDemoShell(
  options: CreateAdminShellOptions = {}
): AdminShellState {
  const dataset = options.dataset ?? demoOperatorDataset;
  const viewport = options.viewport ?? "desktop";
  const activeRoute = options.routeId ?? (viewport === "mobile" ? "site-lead-roster" : "work-queue");

  return {
    application: "staffing-ops-admin",
    targetPersona: systemProfile.primaryPersona,
    defaultTimezone: systemProfile.timezone,
    defaultCurrency: systemProfile.currency,
    header: {
      eyebrow: "Internal Operations OS",
      title: "South Korea staffing control tower",
      subtitle:
        "Client order intake, placement, attendance review, and invoice handoff in one operator loop.",
      scopeLabel: "Asia/Seoul / KRW / same-day ops",
      quickActions: ["Create order", "Log exception", "Upload evidence"]
    },
    navigation: navigationItems,
    viewport,
    activeRoute,
    screens: {
      workQueue: buildWorkQueueScreen(dataset),
      demand: buildDemandScreen(dataset, options),
      placement: buildPlacementScreen(dataset, options),
      attendance: buildAttendanceScreen(dataset, options),
      billing: buildBillingScreen(dataset, options),
      siteLeadRoster: buildSiteLeadRosterScreen(dataset)
    }
  };
}

export function getDescriptorTone(tone: SurfaceTone): string {
  switch (tone) {
    case "accent":
      return "accent";
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    default:
      return "neutral";
  }
}

export function describeOrderStatus(status: string): string {
  return orderStatusDescriptors[status as keyof typeof orderStatusDescriptors]?.label ?? status;
}

export function describePlacementStatus(status: string): string {
  return (
    assignmentStatusDescriptors[status as keyof typeof assignmentStatusDescriptors]?.label ?? status
  );
}

export function describeAttendanceStatus(status: string): string {
  return (
    attendanceStatusDescriptors[status as keyof typeof attendanceStatusDescriptors]?.label ?? status
  );
}

export function describeBillingStatus(status: string): string {
  return billingStatusDescriptors[status as keyof typeof billingStatusDescriptors]?.label ?? status;
}

export function describeReadiness(label: string): string {
  return readinessDescriptors[label as keyof typeof readinessDescriptors]?.label ?? label;
}

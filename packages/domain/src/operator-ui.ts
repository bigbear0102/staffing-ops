export type SurfaceTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface StatusDescriptor {
  readonly label: string;
  readonly tone: SurfaceTone;
  readonly detail: string;
}

export const workQueueLabels = [
  "Needs staffing",
  "Compliance missing",
  "Attendance exceptions",
  "Ready for invoice handoff"
] as const;

export type WorkQueueLabel = (typeof workQueueLabels)[number];

export const workerReadinessBadges = [
  "Ready",
  "Missing docs",
  "Qualification review",
  "Inactive"
] as const;

export type WorkerReadinessBadge = (typeof workerReadinessBadges)[number];

export const orderStatuses = [
  "draft",
  "pending_commercial",
  "pending_site_setup",
  "ready_for_staffing",
  "staffing_in_progress",
  "partially_filled",
  "fully_filled",
  "in_service",
  "closed",
  "cancelled"
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const assignmentStatuses = [
  "candidate_pool",
  "contacting",
  "worker_confirmed",
  "client_pending",
  "assigned",
  "arrived_first_shift",
  "active",
  "replacement_requested",
  "ended",
  "cancelled_before_start"
] as const;

export type AssignmentStatus = (typeof assignmentStatuses)[number];

export const attendanceStatuses = [
  "planned",
  "captured",
  "exception_pending",
  "site_review_pending",
  "approved",
  "corrected",
  "locked_for_handoff"
] as const;

export type AttendanceStatus = (typeof attendanceStatuses)[number];

export const billingStatuses = [
  "approval_blocked",
  "ready_for_handoff",
  "handoff_in_progress",
  "invoice_sent"
] as const;

export type BillingStatus = (typeof billingStatuses)[number];

export const orderStatusDescriptors = {
  draft: {
    label: "Draft",
    tone: "neutral",
    detail: "Still collecting required demand data."
  },
  pending_commercial: {
    label: "Pending commercial",
    tone: "warning",
    detail: "Missing rate or overtime terms before release."
  },
  pending_site_setup: {
    label: "Pending site setup",
    tone: "warning",
    detail: "Missing site-level operating data or approval route."
  },
  ready_for_staffing: {
    label: "Ready for staffing",
    tone: "accent",
    detail: "Can move directly into the staffing queue."
  },
  staffing_in_progress: {
    label: "Staffing in progress",
    tone: "accent",
    detail: "Coordinator is actively contacting and evaluating workers."
  },
  partially_filled: {
    label: "Partially filled",
    tone: "warning",
    detail: "Some slots are staffed, but the order still has open demand."
  },
  fully_filled: {
    label: "Fully filled",
    tone: "success",
    detail: "All requested headcount is placed."
  },
  in_service: {
    label: "In service",
    tone: "success",
    detail: "Live assignment coverage is under day-of-ops control."
  },
  closed: {
    label: "Closed",
    tone: "neutral",
    detail: "Operationally complete."
  },
  cancelled: {
    label: "Cancelled",
    tone: "danger",
    detail: "Order stopped before completion."
  }
} as const satisfies Record<OrderStatus, StatusDescriptor>;

export const assignmentStatusDescriptors = {
  candidate_pool: {
    label: "Candidate pool",
    tone: "neutral",
    detail: "Eligible workers are being reviewed."
  },
  contacting: {
    label: "Contacting",
    tone: "accent",
    detail: "Outreach is in flight."
  },
  worker_confirmed: {
    label: "Worker confirmed",
    tone: "accent",
    detail: "Waiting on final dispatch action."
  },
  client_pending: {
    label: "Client pending",
    tone: "warning",
    detail: "Client-side confirmation is still required."
  },
  assigned: {
    label: "Assigned",
    tone: "success",
    detail: "Assignment snapshot is created."
  },
  arrived_first_shift: {
    label: "Arrived first shift",
    tone: "success",
    detail: "First-day arrival is confirmed."
  },
  active: {
    label: "Active",
    tone: "success",
    detail: "The worker is currently in service."
  },
  replacement_requested: {
    label: "Replacement requested",
    tone: "danger",
    detail: "Same-day service continuity is at risk."
  },
  ended: {
    label: "Ended",
    tone: "neutral",
    detail: "Assignment has finished."
  },
  cancelled_before_start: {
    label: "Cancelled before start",
    tone: "danger",
    detail: "Placement was revoked before day one."
  }
} as const satisfies Record<AssignmentStatus, StatusDescriptor>;

export const attendanceStatusDescriptors = {
  planned: {
    label: "Planned",
    tone: "neutral",
    detail: "Expected shift generated from assignment schedule."
  },
  captured: {
    label: "Captured",
    tone: "accent",
    detail: "Actual attendance is present but not fully resolved."
  },
  exception_pending: {
    label: "Exception pending",
    tone: "danger",
    detail: "Mismatch or missing information blocks approval."
  },
  site_review_pending: {
    label: "Site review pending",
    tone: "warning",
    detail: "Waiting on site-lead confirmation."
  },
  approved: {
    label: "Approved",
    tone: "success",
    detail: "Ready for downstream handoff."
  },
  corrected: {
    label: "Corrected",
    tone: "accent",
    detail: "Original values are preserved with a typed reason."
  },
  locked_for_handoff: {
    label: "Locked for handoff",
    tone: "success",
    detail: "Attendance cannot be silently edited downstream."
  }
} as const satisfies Record<AttendanceStatus, StatusDescriptor>;

export const billingStatusDescriptors = {
  approval_blocked: {
    label: "Approval blocked",
    tone: "danger",
    detail: "Missing attendance approvals or unresolved deltas."
  },
  ready_for_handoff: {
    label: "Ready for handoff",
    tone: "success",
    detail: "Finance can export or hand off the draft."
  },
  handoff_in_progress: {
    label: "Handoff in progress",
    tone: "accent",
    detail: "Finance is reviewing the final invoice package."
  },
  invoice_sent: {
    label: "Invoice sent",
    tone: "neutral",
    detail: "The draft is immutable after send."
  }
} as const satisfies Record<BillingStatus, StatusDescriptor>;

export const readinessDescriptors = {
  Ready: {
    label: "Ready",
    tone: "success",
    detail: "Can be placed now."
  },
  "Missing docs": {
    label: "Missing docs",
    tone: "danger",
    detail: "Required compliance artifacts are not valid for the work period."
  },
  "Qualification review": {
    label: "Qualification review",
    tone: "warning",
    detail: "Needs manual qualification confirmation before placement."
  },
  Inactive: {
    label: "Inactive",
    tone: "neutral",
    detail: "Not available for dispatch."
  }
} as const satisfies Record<WorkerReadinessBadge, StatusDescriptor>;

export interface DemoOrderRecord {
  readonly id: string;
  readonly clientName: string;
  readonly siteName: string;
  readonly role: string;
  readonly serviceType: "dispatch" | "subcontracting" | "outsourcing";
  readonly headcount: number;
  readonly filledHeadcount: number;
  readonly dateRange: string;
  readonly shiftPattern: string;
  readonly status: OrderStatus;
  readonly riskLevel: "critical" | "high" | "medium" | "low";
  readonly sourceChannel: string;
  readonly evidenceLinkLabel: string;
  readonly blockers: readonly string[];
  readonly nextAction: string;
  readonly attendanceApprovalMethod: string;
  readonly billRateKrw: number | null;
  readonly overtimeRule: string | null;
}

export interface PlacementCandidateRecord {
  readonly id: string;
  readonly workerName: string;
  readonly availability: string;
  readonly assignmentStatus: AssignmentStatus;
  readonly readinessBadge: WorkerReadinessBadge;
  readonly qualificationFit: "High fit" | "Medium fit" | "Needs review";
  readonly geography: string;
  readonly recentAssignment: string;
  readonly riskFlags: readonly string[];
  readonly primaryAction: string;
  readonly auditTrail: readonly AuditTrailEntry[];
}

export interface AuditTrailDelta {
  readonly label: string;
  readonly before: string;
  readonly after: string;
}

export interface AuditTrailEntry {
  readonly id: string;
  readonly title: string;
  readonly actorName: string;
  readonly actorRole: string;
  readonly occurredAt: string;
  readonly tone: SurfaceTone;
  readonly summary: string;
  readonly reason: string | null;
  readonly sourceTrace: readonly string[];
  readonly deltas: readonly AuditTrailDelta[];
}

export interface AttendanceRecord {
  readonly id: string;
  readonly assignmentId: string;
  readonly workerName: string;
  readonly assignmentLabel: string;
  readonly siteName: string;
  readonly workDate: string;
  readonly scheduledWindow: string;
  readonly actualWindow: string;
  readonly breakMinutes: number;
  readonly overtimeMinutes: number;
  readonly status: AttendanceStatus;
  readonly exceptionCode: string | null;
  readonly source: string;
  readonly reason: string | null;
  readonly evidenceLinkLabel: string | null;
  readonly primaryAction: string;
  readonly linkedBillingDraftId: string | null;
  readonly auditTrail: readonly AuditTrailEntry[];
}

export interface BillingLineItem {
  readonly id: string;
  readonly assignmentLabel: string;
  readonly hours: number;
  readonly billRateKrw: number;
  readonly amountKrw: number;
  readonly attendanceSource: string;
  readonly sourceAssignmentId: string;
  readonly sourceAttendanceId: string;
}

export interface BillingBatchRecord {
  readonly id: string;
  readonly batchLabel: string;
  readonly destination: string;
  readonly generatedAt: string;
  readonly generatedBy: string;
  readonly rowCount: number;
  readonly totalAmountKrw: number;
  readonly sourceTrace: readonly string[];
  readonly reviewNotes: readonly string[];
}

export interface BillingDraftRecord {
  readonly id: string;
  readonly clientName: string;
  readonly siteName: string;
  readonly billingPeriod: string;
  readonly status: BillingStatus;
  readonly blockedBy: readonly string[];
  readonly manualAdjustments: readonly string[];
  readonly totalAmountKrw: number;
  readonly lineItems: readonly BillingLineItem[];
  readonly primaryAction: string;
  readonly reviewSummary: readonly string[];
  readonly auditTrail: readonly AuditTrailEntry[];
  readonly batch: BillingBatchRecord;
}

export interface SiteLeadRosterShift {
  readonly id: string;
  readonly workerName: string;
  readonly role: string;
  readonly plannedWindow: string;
  readonly arrivalStatus: "Expected" | "Arrived" | "Late risk";
  readonly exceptionSummary: string;
  readonly quickActions: readonly ["attendance", "exception", "evidence"];
  readonly attendanceSyncStatus: "Synced" | "Pending sync" | "Retry required";
  readonly attendanceSyncTone: SurfaceTone;
  readonly attendanceSyncDetail: string;
  readonly attendanceRecordId: string;
  readonly submissionDedupeKey: string;
  readonly duplicateSubmitGuardNote: string | null;
  readonly evidenceUploadStatus: "Uploaded" | "Pending upload" | "Retry required";
  readonly evidenceUploadTone: SurfaceTone;
  readonly evidenceUploadDetail: string;
  readonly evidenceUploadId: string | null;
  readonly selectedRecordContext: string;
  readonly desktopConvergenceNote: string;
}

export interface WorkQueueItem {
  readonly id: string;
  readonly orderId?: string;
  readonly queue: WorkQueueLabel;
  readonly title: string;
  readonly subtitle: string;
  readonly owner: string;
  readonly urgency: "Immediate" | "Today" | "This shift";
  readonly blocker: string;
  readonly nextAction: string;
}

export interface AlertRecord {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly tone: SurfaceTone;
}

export interface QueueSummaryCard {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly detail: string;
  readonly tone: SurfaceTone;
}

export interface OperatorDashboardDataset {
  readonly workQueues: readonly WorkQueueItem[];
  readonly orders: readonly DemoOrderRecord[];
  readonly placementCandidates: readonly PlacementCandidateRecord[];
  readonly attendanceRecords: readonly AttendanceRecord[];
  readonly billingDrafts: readonly BillingDraftRecord[];
  readonly siteLeadRoster: {
    readonly siteName: string;
    readonly shiftDate: string;
    readonly leadName: string;
    readonly shifts: readonly SiteLeadRosterShift[];
  };
  readonly alerts: readonly AlertRecord[];
}

export const demoOperatorDataset = {
  workQueues: [
    {
      id: "queue-1",
      orderId: "order-seoul-east-mall",
      queue: "Needs staffing",
      title: "Seoul East Mall / weekend merchandising crew",
      subtitle: "4 open heads across dispatch and outsourcing mix",
      owner: "Ops desk A",
      urgency: "Immediate",
      blocker: "Only one ready candidate is valid for the Saturday night premium rule.",
      nextAction: "Match workers"
    },
    {
      id: "queue-2",
      orderId: "order-incheon-cold-chain",
      queue: "Compliance missing",
      title: "Incheon cold-chain loaders",
      subtitle: "2 workers are shortlisted but one health-check artifact expired",
      owner: "Compliance pod",
      urgency: "Today",
      blocker: "Cold-chain medical clearance expires before first shift.",
      nextAction: "Resolve blocker"
    },
    {
      id: "queue-3",
      orderId: "order-suwon-electronics",
      queue: "Attendance exceptions",
      title: "Suwon electronics night shift",
      subtitle: "Overtime dispute and one site-submission gap",
      owner: "Attendance desk",
      urgency: "This shift",
      blocker: "Site leader has not confirmed the adjusted overtime window.",
      nextAction: "Review exception"
    },
    {
      id: "queue-4",
      orderId: "order-busan-hotel",
      queue: "Ready for invoice handoff",
      title: "Busan hotel housekeeping block",
      subtitle: "Approved attendance is ready once one manual surcharge is acknowledged",
      owner: "Finance handoff",
      urgency: "Today",
      blocker: "Manual transport surcharge still needs typed reason confirmation.",
      nextAction: "Send handoff"
    }
  ],
  orders: [
    {
      id: "order-seoul-east-mall",
      clientName: "Hanbit Retail",
      siteName: "Seoul East Mall",
      role: "Weekend merchandising crew",
      serviceType: "outsourcing",
      headcount: 12,
      filledHeadcount: 8,
      dateRange: "2026-04-11 -> 2026-04-26",
      shiftPattern: "Sat-Sun / 10:00-19:00",
      status: "ready_for_staffing",
      riskLevel: "critical",
      sourceChannel: "KakaoTalk",
      evidenceLinkLabel: "Chat summary #204",
      blockers: [],
      nextAction: "Match workers",
      attendanceApprovalMethod: "Site leader mobile approval by 22:00",
      billRateKrw: 23800,
      overtimeRule: "Night premium after 22:00"
    },
    {
      id: "order-suwon-electronics",
      clientName: "Daesung Devices",
      siteName: "Suwon Assembly Campus",
      role: "Night inspection operator",
      serviceType: "dispatch",
      headcount: 6,
      filledHeadcount: 6,
      dateRange: "2026-04-08 -> 2026-04-30",
      shiftPattern: "Mon-Fri / 20:00-05:00",
      status: "in_service",
      riskLevel: "high",
      sourceChannel: "Recurring template",
      evidenceLinkLabel: "Template W15",
      blockers: [],
      nextAction: "Review attendance",
      attendanceApprovalMethod: "Site leader + ops dual review",
      billRateKrw: 26200,
      overtimeRule: "Night premium and meal stipend"
    },
    {
      id: "order-busan-hotel",
      clientName: "Blue Harbor Hotel Group",
      siteName: "Busan Harbor Hotel",
      role: "Housekeeping float team",
      serviceType: "subcontracting",
      headcount: 9,
      filledHeadcount: 9,
      dateRange: "2026-04-01 -> 2026-04-30",
      shiftPattern: "Daily / 08:00-17:00",
      status: "fully_filled",
      riskLevel: "medium",
      sourceChannel: "Email",
      evidenceLinkLabel: "Email packet 14A",
      blockers: [],
      nextAction: "Prepare billing",
      attendanceApprovalMethod: "Ops review after exported site sheet",
      billRateKrw: 19800,
      overtimeRule: "Holiday premium by client calendar"
    },
    {
      id: "order-incheon-cold-chain",
      clientName: "Mirae Logistics",
      siteName: "Incheon Cold Chain Hub",
      role: "Warehouse loader",
      serviceType: "dispatch",
      headcount: 4,
      filledHeadcount: 0,
      dateRange: "2026-04-09 -> 2026-05-02",
      shiftPattern: "Tue-Sat / 06:00-15:00",
      status: "pending_commercial",
      riskLevel: "high",
      sourceChannel: "Phone",
      evidenceLinkLabel: "Call memo 77",
      blockers: ["Bill rate confirmation", "Meal allowance rule"],
      nextAction: "Publish order",
      attendanceApprovalMethod: "Site lead roster confirmation",
      billRateKrw: null,
      overtimeRule: null
    }
  ],
  placementCandidates: [
    {
      id: "candidate-jiyoon-park",
      workerName: "Jiyoon Park",
      availability: "Available Sat-Sun after 09:00",
      assignmentStatus: "worker_confirmed",
      readinessBadge: "Ready",
      qualificationFit: "High fit",
      geography: "Seoul east cluster",
      recentAssignment: "Last worked at Hanbit Retail in March",
      riskFlags: [],
      primaryAction: "Confirm assignment",
      auditTrail: [
        {
          id: "placement-audit-jiyoon-1",
          title: "Eligibility reconfirmed",
          actorName: "Ops coordinator / Minji Seo",
          actorRole: "Operations Operator",
          occurredAt: "2026-04-07 08:52 KST",
          tone: "success",
          summary: "Weekend merchandising availability and prior client fit were reconfirmed.",
          reason: null,
          sourceTrace: ["Worker record / jiyoon-park", "Hanbit Retail March assignment snapshot"],
          deltas: [
            {
              label: "Assignment status",
              before: "Candidate pool",
              after: "Worker confirmed"
            },
            {
              label: "Primary action",
              before: "Review fit",
              after: "Confirm assignment"
            }
          ]
        }
      ]
    },
    {
      id: "candidate-minsu-lee",
      workerName: "Minsu Lee",
      availability: "Available full weekend",
      assignmentStatus: "contacting",
      readinessBadge: "Missing docs",
      qualificationFit: "High fit",
      geography: "Any Seoul site",
      recentAssignment: "No cold-chain restriction, but artifact expires 2026-04-10",
      riskFlags: ["Medical clearance expires before start"],
      primaryAction: "Resolve blocker",
      auditTrail: [
        {
          id: "placement-audit-minsu-1",
          title: "Override review opened",
          actorName: "Ops manager / J. Han",
          actorRole: "Operations Manager",
          occurredAt: "2026-04-07 09:12 KST",
          tone: "warning",
          summary: "The candidate stayed reviewable instead of being dropped outright from the shortlist.",
          reason: "Site manager requested one supervised first shift while the medical clearance renewal clears.",
          sourceTrace: [
            "Compliance desk / artifact-778",
            "Site request / Seoul East Mall weekend surge"
          ],
          deltas: [
            {
              label: "Medical clearance",
              before: "Expires before first shift",
              after: "One-shift override review opened"
            },
            {
              label: "Primary action",
              before: "Drop from shortlist",
              after: "Resolve blocker"
            }
          ]
        }
      ]
    },
    {
      id: "candidate-haeun-choi",
      workerName: "Haeun Choi",
      availability: "Available only Sunday",
      assignmentStatus: "candidate_pool",
      readinessBadge: "Qualification review",
      qualificationFit: "Needs review",
      geography: "Suwon and Seoul east",
      recentAssignment: "Qualified for merchandising, supervisor sign-off missing",
      riskFlags: ["Supervisor approval still pending"],
      primaryAction: "Request review",
      auditTrail: [
        {
          id: "placement-audit-haeun-1",
          title: "Qualification escalation",
          actorName: "Compliance pod / Ara Jeong",
          actorRole: "Operations Manager",
          occurredAt: "2026-04-07 08:18 KST",
          tone: "warning",
          summary: "Supervisor sign-off is still the only remaining blocker.",
          reason: "The worker can cover Sunday only if the merchandising supervisor signs off on the seasonal SKU reset.",
          sourceTrace: ["Supervisor sign-off queue / merch-approval-22"],
          deltas: [
            {
              label: "Readiness",
              before: "Missing review",
              after: "Qualification review"
            }
          ]
        }
      ]
    }
  ],
  attendanceRecords: [
    {
      id: "att-1",
      assignmentId: "assignment-busan-hotel-2",
      workerName: "Jiyoon Park",
      assignmentLabel: "Busan Harbor Hotel / housekeeping",
      siteName: "Busan Harbor Hotel",
      workDate: "2026-04-07",
      scheduledWindow: "08:00-17:00",
      actualWindow: "08:02-17:03",
      breakMinutes: 60,
      overtimeMinutes: 0,
      status: "approved",
      exceptionCode: null,
      source: "site manager mobile entry",
      reason: null,
      evidenceLinkLabel: null,
      primaryAction: "Bulk approve",
      linkedBillingDraftId: "bill-1",
      auditTrail: [
        {
          id: "attendance-audit-att-1",
          title: "Attendance approved",
          actorName: "Ops coordinator / Minji Seo",
          actorRole: "Operations Operator",
          occurredAt: "2026-04-07 17:08 KST",
          tone: "success",
          summary: "Clean row moved directly into the finance review batch.",
          reason: null,
          sourceTrace: ["Attendance row / att-1", "Billing batch / batch-busan-week2"],
          deltas: [
            {
              label: "Status",
              before: "Captured",
              after: "Approved"
            },
            {
              label: "Billing handoff",
              before: "Not requested",
              after: "Queued for week-2 export"
            }
          ]
        }
      ]
    },
    {
      id: "att-2",
      assignmentId: "assignment-suwon-inspection-1",
      workerName: "Minseo Kang",
      assignmentLabel: "Suwon Assembly / inspection",
      siteName: "Suwon Assembly Campus",
      workDate: "2026-04-08",
      scheduledWindow: "20:00-05:00",
      actualWindow: "20:25-05:40",
      breakMinutes: 45,
      overtimeMinutes: 40,
      status: "exception_pending",
      exceptionCode: "Overtime dispute",
      source: "KakaoTalk screenshot",
      reason: "Site lead says line stop caused premium overtime; worker logged manual extension.",
      evidenceLinkLabel: "Chat capture / line-stop note",
      primaryAction: "Review exception",
      linkedBillingDraftId: "bill-2",
      auditTrail: [
        {
          id: "attendance-audit-att-2",
          title: "Exception escalated",
          actorName: "Attendance desk / H. Kim",
          actorRole: "Operations Operator",
          occurredAt: "2026-04-09 07:18 KST",
          tone: "warning",
          summary: "Finance can see the billing impact, but approval is still blocked on operator judgment.",
          reason: "Overtime must be reconciled against the line-stop note before the row can move downstream.",
          sourceTrace: [
            "Attendance row / att-2",
            "KakaoTalk screenshot / line-stop note",
            "Billing draft / bill-2"
          ],
          deltas: [
            {
              label: "Status",
              before: "Captured",
              after: "Exception pending"
            },
            {
              label: "Overtime minutes",
              before: "0",
              after: "40"
            }
          ]
        }
      ]
    },
    {
      id: "att-3",
      assignmentId: "assignment-busan-hotel-1",
      workerName: "Sora Han",
      assignmentLabel: "Busan Harbor Hotel / housekeeping",
      siteName: "Busan Harbor Hotel",
      workDate: "2026-04-06",
      scheduledWindow: "08:00-17:00",
      actualWindow: "08:00-16:25",
      breakMinutes: 60,
      overtimeMinutes: 0,
      status: "corrected",
      exceptionCode: "Early leave",
      source: "uploaded XLSX",
      reason: "Transport disruption approved as paid partial shift by AM.",
      evidenceLinkLabel: "Transit incident form",
      primaryAction: "Lock for handoff",
      linkedBillingDraftId: "bill-1",
      auditTrail: [
        {
          id: "attendance-audit-att-3-correction",
          title: "Retro correction applied",
          actorName: "Ops coordinator / Minji Seo",
          actorRole: "Operations Operator",
          occurredAt: "2026-04-06 18:40 KST",
          tone: "accent",
          summary: "The original import stayed visible while the payable partial shift was captured for review.",
          reason: "Transport disruption approved as paid partial shift by AM.",
          sourceTrace: [
            "Attendance import / uploaded XLSX",
            "Transit incident form / busan-transport-14"
          ],
          deltas: [
            {
              label: "Actual window",
              before: "08:00-17:00",
              after: "08:00-16:25"
            },
            {
              label: "Status",
              before: "Submitted",
              after: "Corrected"
            }
          ]
        },
        {
          id: "attendance-audit-att-3-reapproval",
          title: "Correction re-approved",
          actorName: "Finance reviewer / H. Kim",
          actorRole: "Finance Admin",
          occurredAt: "2026-04-06 19:02 KST",
          tone: "success",
          summary: "The corrected row is ready for the invoice handoff batch with original values preserved.",
          reason: "Correction reason and incident form matched the approved transport exception policy.",
          sourceTrace: ["Attendance row / att-3", "Billing batch / batch-busan-week2"],
          deltas: [
            {
              label: "Status",
              before: "Corrected",
              after: "Locked for handoff"
            },
            {
              label: "Batch readiness",
              before: "Manual review",
              after: "Export ready"
            }
          ]
        }
      ]
    },
    {
      id: "att-4",
      assignmentId: "assignment-suwon-inspection-2",
      workerName: "Eunji Kim",
      assignmentLabel: "Suwon Assembly / inspection",
      siteName: "Suwon Assembly Campus",
      workDate: "2026-04-08",
      scheduledWindow: "20:00-05:00",
      actualWindow: "--",
      breakMinutes: 0,
      overtimeMinutes: 0,
      status: "site_review_pending",
      exceptionCode: "Missing submission at cutoff",
      source: "pending site lead confirmation",
      reason: "No attendance posted by 07:00 cutoff.",
      evidenceLinkLabel: "Cutoff breach alert",
      primaryAction: "Escalate to site lead",
      linkedBillingDraftId: "bill-3",
      auditTrail: [
        {
          id: "attendance-audit-att-4",
          title: "Cutoff breach captured",
          actorName: "Attendance desk / H. Kim",
          actorRole: "Operations Operator",
          occurredAt: "2026-04-09 07:03 KST",
          tone: "danger",
          summary: "The site has not posted an attendance row, so billing remains blocked.",
          reason: "No attendance posted by the 07:00 cutoff.",
          sourceTrace: ["Cutoff breach alert / suwon-night-2026-04-08", "Billing draft / bill-3"],
          deltas: [
            {
              label: "Status",
              before: "Planned",
              after: "Site review pending"
            }
          ]
        }
      ]
    }
  ],
  billingDrafts: [
    {
      id: "bill-1",
      clientName: "Blue Harbor Hotel Group",
      siteName: "Busan Harbor Hotel",
      billingPeriod: "2026-04 / week 2",
      status: "ready_for_handoff",
      blockedBy: [],
      manualAdjustments: ["Transport surcharge +18,000 KRW / reason captured"],
      totalAmountKrw: 2286400,
      primaryAction: "Send handoff",
      reviewSummary: [
        "2 approved attendance rows are bundled for the week-2 spreadsheet-first handoff.",
        "One corrected row keeps the original import and correction reason in the proof pack."
      ],
      auditTrail: [
        {
          id: "billing-audit-bill-1",
          title: "Export batch assembled",
          actorName: "Finance admin / H. Kim",
          actorRole: "Finance Admin",
          occurredAt: "2026-04-07 09:05 KST",
          tone: "success",
          summary: "The hotel housekeeping batch is fully traceable and ready to send.",
          reason: "All attendance rows are approved or locked for handoff.",
          sourceTrace: ["Billing draft / bill-1", "Export batch / batch-busan-week2"],
          deltas: [
            {
              label: "Status",
              before: "Approval review",
              after: "Ready for handoff"
            }
          ]
        }
      ],
      batch: {
        id: "batch-busan-week2",
        batchLabel: "Busan week-2 export batch",
        destination: "Spreadsheet-first finance handoff",
        generatedAt: "2026-04-07 09:05 KST",
        generatedBy: "Finance admin / H. Kim",
        rowCount: 2,
        totalAmountKrw: 2286400,
        sourceTrace: [
          "Assignment assignment-busan-hotel-1 -> Attendance att-3 -> corrected XLSX import",
          "Assignment assignment-busan-hotel-2 -> Attendance att-1 -> site manager mobile entry"
        ],
        reviewNotes: [
          "Manual transport surcharge reason is preserved in the draft review notes.",
          "Corrected attendance remains linked to the original import evidence."
        ]
      },
      lineItems: [
        {
          id: "line-1",
          assignmentLabel: "Housekeeping float / 2026-04-06",
          hours: 8,
          billRateKrw: 19800,
          amountKrw: 158400,
          attendanceSource: "Uploaded XLSX / corrected",
          sourceAssignmentId: "assignment-busan-hotel-1",
          sourceAttendanceId: "att-3"
        },
        {
          id: "line-2",
          assignmentLabel: "Housekeeping float / 2026-04-07",
          hours: 8,
          billRateKrw: 19800,
          amountKrw: 158400,
          attendanceSource: "Uploaded XLSX / approved",
          sourceAssignmentId: "assignment-busan-hotel-2",
          sourceAttendanceId: "att-1"
        }
      ]
    },
    {
      id: "bill-2",
      clientName: "Daesung Devices",
      siteName: "Suwon Assembly Campus",
      billingPeriod: "2026-04 / week 2",
      status: "approval_blocked",
      blockedBy: ["Overtime dispute still needs operator approval on attendance row att-2"],
      manualAdjustments: [],
      totalAmountKrw: 3124800,
      primaryAction: "Resolve approvals",
      reviewSummary: [
        "Finance review is assembled, but one overtime row is still blocked in the attendance queue.",
        "Once att-2 clears, the batch can move straight to spreadsheet export review."
      ],
      auditTrail: [
        {
          id: "billing-audit-bill-2",
          title: "Batch blocked at approval gate",
          actorName: "Finance admin / H. Kim",
          actorRole: "Finance Admin",
          occurredAt: "2026-04-09 07:26 KST",
          tone: "warning",
          summary: "The draft is fully priced but cannot hand off until the disputed overtime row is approved.",
          reason: "Attendance row att-2 still has an unresolved overtime dispute.",
          sourceTrace: ["Billing draft / bill-2", "Attendance row / att-2"],
          deltas: [
            {
              label: "Status",
              before: "Preview batch",
              after: "Approval blocked"
            }
          ]
        }
      ],
      batch: {
        id: "batch-suwon-week2",
        batchLabel: "Suwon week-2 export batch",
        destination: "Spreadsheet-first finance handoff",
        generatedAt: "Pending approval release",
        generatedBy: "Finance review queue",
        rowCount: 1,
        totalAmountKrw: 3124800,
        sourceTrace: [
          "Assignment assignment-suwon-inspection-1 -> Attendance att-2 -> KakaoTalk screenshot / exception pending"
        ],
        reviewNotes: [
          "Operator approval is the only remaining gate before export.",
          "Finance is holding the batch to avoid manual spreadsheet re-entry."
        ]
      },
      lineItems: [
        {
          id: "line-3",
          assignmentLabel: "Night inspection / 2026-04-08",
          hours: 8.67,
          billRateKrw: 26200,
          amountKrw: 227154,
          attendanceSource: "KakaoTalk screenshot / exception pending",
          sourceAssignmentId: "assignment-suwon-inspection-1",
          sourceAttendanceId: "att-2"
        }
      ]
    },
    {
      id: "bill-3",
      clientName: "Daesung Devices",
      siteName: "Suwon Assembly Campus",
      billingPeriod: "2026-04 / week 2",
      status: "approval_blocked",
      blockedBy: ["Missing submission at cutoff still needs site-lead confirmation for att-4"],
      manualAdjustments: [],
      totalAmountKrw: 0,
      primaryAction: "Escalate to site lead",
      reviewSummary: [
        "A separate draft remains blocked until the site lead posts the missing shift row.",
        "This keeps the operator and finance teams aligned on why not every Suwon line can export yet."
      ],
      auditTrail: [
        {
          id: "billing-audit-bill-3",
          title: "Site lead follow-up pending",
          actorName: "Finance admin / H. Kim",
          actorRole: "Finance Admin",
          occurredAt: "2026-04-09 07:24 KST",
          tone: "danger",
          summary: "No billable hours can be released because the attendance row does not exist yet.",
          reason: "Attendance row att-4 is still waiting on site-lead confirmation.",
          sourceTrace: ["Billing draft / bill-3", "Attendance row / att-4"],
          deltas: [
            {
              label: "Status",
              before: "Preview batch",
              after: "Approval blocked"
            }
          ]
        }
      ],
      batch: {
        id: "batch-suwon-cutoff-breach",
        batchLabel: "Suwon cutoff-breach hold batch",
        destination: "Spreadsheet-first finance handoff",
        generatedAt: "Waiting on site lead",
        generatedBy: "Finance review queue",
        rowCount: 0,
        totalAmountKrw: 0,
        sourceTrace: [
          "Attendance att-4 missing -> no assignment export row emitted"
        ],
        reviewNotes: ["The batch stays empty until the missing attendance submission is posted."]
      },
      lineItems: [
        {
          id: "line-4",
          assignmentLabel: "Night inspection / missing cutoff row",
          hours: 0,
          billRateKrw: 26200,
          amountKrw: 0,
          attendanceSource: "Pending site lead confirmation",
          sourceAssignmentId: "assignment-suwon-inspection-2",
          sourceAttendanceId: "att-4"
        }
      ]
    }
  ],
  siteLeadRoster: {
    siteName: "Seoul East Mall",
    shiftDate: "2026-04-11",
    leadName: "On-site lead / Ara Jeong",
    shifts: [
      {
        id: "roster-1",
        workerName: "Jiyoon Park",
        role: "Merchandising crew",
        plannedWindow: "10:00-19:00",
        arrivalStatus: "Arrived",
        exceptionSummary: "No exception",
        quickActions: ["attendance", "exception", "evidence"],
        attendanceSyncStatus: "Synced",
        attendanceSyncTone: "success",
        attendanceSyncDetail:
          "Check-in posted on the first attempt and already matches the desktop attendance queue.",
        attendanceRecordId: "att-mobile-roster-1",
        submissionDedupeKey: "site-lead:roster-1:2026-04-11:check-in",
        duplicateSubmitGuardNote: null,
        evidenceUploadStatus: "Uploaded",
        evidenceUploadTone: "success",
        evidenceUploadDetail:
          "Gate-arrival photo attached on the first upload and linked to the same attendance record.",
        evidenceUploadId: "upload-roster-1",
        selectedRecordContext:
          "Attendance and evidence stay anchored to Jiyoon Park while the site lead moves between drawers.",
        desktopConvergenceNote: "Desktop queue shows arrival confirmed with no exception state."
      },
      {
        id: "roster-2",
        workerName: "Minsu Lee",
        role: "Merchandising crew",
        plannedWindow: "10:00-19:00",
        arrivalStatus: "Expected",
        exceptionSummary: "Medical clearance check at gate",
        quickActions: ["attendance", "exception", "evidence"],
        attendanceSyncStatus: "Pending sync",
        attendanceSyncTone: "warning",
        attendanceSyncDetail:
          "Check-in was saved locally after connectivity dropped. Retry will reuse the queued submit token instead of posting a second row.",
        attendanceRecordId: "att-mobile-pending-1",
        submissionDedupeKey: "site-lead:roster-2:2026-04-11:check-in",
        duplicateSubmitGuardNote:
          "Second tap at 09:59 reused the same submit token, so no duplicate attendance submission was created.",
        evidenceUploadStatus: "Pending upload",
        evidenceUploadTone: "warning",
        evidenceUploadDetail:
          "The medical-clearance gate photo stays attached to the same queued record until the submit finishes.",
        evidenceUploadId: "upload-roster-2",
        selectedRecordContext:
          "Selected record remains Minsu Lee / medical-clearance check even after the failed submit.",
        desktopConvergenceNote:
          "When connectivity resumes, the same attendance record moves into desktop site review instead of creating a duplicate row."
      },
      {
        id: "roster-3",
        workerName: "Haeun Choi",
        role: "Standby replacement",
        plannedWindow: "12:00-19:00",
        arrivalStatus: "Late risk",
        exceptionSummary: "Transit delay reported by phone",
        quickActions: ["attendance", "exception", "evidence"],
        attendanceSyncStatus: "Synced",
        attendanceSyncTone: "accent",
        attendanceSyncDetail:
          "Delay exception draft is already posted, but the supporting photo still needs a successful upload retry.",
        attendanceRecordId: "att-mobile-evidence-1",
        submissionDedupeKey: "site-lead:roster-3:2026-04-11:delay-note",
        duplicateSubmitGuardNote: null,
        evidenceUploadStatus: "Retry required",
        evidenceUploadTone: "danger",
        evidenceUploadDetail:
          "Transit-photo upload failed on unstable 3G. Retry keeps the exception drawer on the same roster row after reload.",
        evidenceUploadId: "upload-roster-3",
        selectedRecordContext:
          "The site lead returns to Haeun Choi / transit delay with the same pending image attached.",
        desktopConvergenceNote:
          "Desktop queue keeps the row in evidence-missing review until the upload retry succeeds."
      }
    ]
  },
  alerts: [
    {
      id: "alert-1",
      title: "3 compliance artifacts expire in 48h",
      detail: "Cold-chain medical clearance and one resident permit renewal are inside the dispatch start window.",
      tone: "warning"
    },
    {
      id: "alert-2",
      title: "1 first-shift arrival still unconfirmed",
      detail: "Seoul East Mall standby replacement is trending late against the fast-path SLA.",
      tone: "danger"
    },
    {
      id: "alert-3",
      title: "Recurring hotel block is ready for week-2 billing",
      detail: "All approved rows are traceable back to assignment snapshots.",
      tone: "success"
    }
  ]
} as const satisfies OperatorDashboardDataset;

export function formatCurrencyKrw(amount: number | null): string {
  if (amount === null) {
    return "Pending confirmation";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(amount) + " KRW";
}

export function buildQueueSummaryCards(
  dataset: OperatorDashboardDataset = demoOperatorDataset
): readonly QueueSummaryCard[] {
  const openOrders = dataset.orders.filter(
    (order) => order.status !== "closed" && order.status !== "cancelled"
  ).length;
  const unfilledHeadcount = dataset.orders.reduce((total, order) => {
    return total + Math.max(order.headcount - order.filledHeadcount, 0);
  }, 0);
  const workersBlockedByCompliance = dataset.placementCandidates.filter(
    (candidate) => candidate.readinessBadge !== "Ready"
  ).length;
  const attendanceExceptions = dataset.attendanceRecords.filter(
    (record) => record.status === "exception_pending" || record.status === "site_review_pending"
  ).length;
  const invoiceBlockers = dataset.billingDrafts.filter(
    (draft) => draft.status === "approval_blocked"
  ).length;

  return [
    {
      id: "open-orders",
      label: "Open orders",
      value: openOrders,
      detail: "Orders that still matter to the current operating loop.",
      tone: "accent"
    },
    {
      id: "unfilled-headcount",
      label: "Unfilled headcount",
      value: unfilledHeadcount,
      detail: "Remaining demand across open staffing orders.",
      tone: "danger"
    },
    {
      id: "blocked-workers",
      label: "Workers blocked by compliance",
      value: workersBlockedByCompliance,
      detail: "Shortlisted workers who cannot be placed yet.",
      tone: "warning"
    },
    {
      id: "attendance-exceptions",
      label: "Attendance exceptions",
      value: attendanceExceptions,
      detail: "Rows that require explicit operator or site review.",
      tone: "danger"
    },
    {
      id: "invoice-blockers",
      label: "Invoice blockers",
      value: invoiceBlockers,
      detail: "Billing drafts that cannot hand off yet.",
      tone: "warning"
    }
  ] as const;
}

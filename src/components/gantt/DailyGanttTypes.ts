export type MilestoneType = "AGENCY_EXECUTION" | "CLIENT_APPROVAL" | "DELIVERY" | "GO_LIVE";

export interface DailyGanttItem {
  id: string;
  projectId: string;
  projectName?: string;
  accountName?: string;
  startDate: string;
  endDate: string;
  responsibleName: string;
  responsibleAvatar?: string;
  activityTitle: string;
  milestoneType: MilestoneType;
  status?: string;
  isProject?: boolean;
}

export interface DailyGanttFilters {
  agencyId?: string;
  accountId?: string;
  projectId?: string;
}

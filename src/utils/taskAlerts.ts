export const RED_TASK_STATUSES = ["PENDING", "IN_PROGRESS", "REVIEW"];

export interface AlertProjectInfo {
  end_date?: string | null;
  delivered_at?: string | null;
}

export function isProjectOverdue(project: AlertProjectInfo | null | undefined): boolean {
  if (!project?.end_date) return false;
  if (project.delivered_at) return false;
  const end = new Date(project.end_date).getTime();
  if (Number.isNaN(end)) return false;
  return end < Date.now();
}

export function isTaskRedAlert(
  taskStatus: string | null | undefined,
  project: AlertProjectInfo | null | undefined
): boolean {
  if (taskStatus === "BLOCKED") return true;
  if (!taskStatus || !RED_TASK_STATUSES.includes(taskStatus)) return false;
  return isProjectOverdue(project);
}

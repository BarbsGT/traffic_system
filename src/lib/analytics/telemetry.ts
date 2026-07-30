interface CellUpdateEvent {
  taskId: string;
  field: string;
  value: string;
  durationMs: number;
}

interface QuickCreateEvent {
  taskId: string;
}

function sendEvent(type: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const event = { type, payload, ts: Date.now() };
    const queue = JSON.parse(sessionStorage.getItem("ag_telemetry") || "[]");
    queue.push(event);
    if (queue.length > 50) queue.splice(0, queue.length - 50);
    sessionStorage.setItem("ag_telemetry", JSON.stringify(queue));
  } catch {
    // telemetry is best-effort, never blocks
  }
}

export function trackCellUpdate(e: CellUpdateEvent) {
  sendEvent("traffic_cell_updated", {
    taskId: e.taskId,
    field: e.field,
    value: e.value,
    durationMs: Math.round(e.durationMs),
  });
}

export function trackQuickCreate(e: QuickCreateEvent) {
  sendEvent("task_quick_created", { taskId: e.taskId });
}

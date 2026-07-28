"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";

interface TaskItem {
  id: string;
  title: string;
  start_date: string | null;
  due_date: string | null;
  status: string;
  project_name?: string;
}

export function GanttTimeline() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("tasks")
      .select("id, title, start_date, due_date, status, projects!tasks_project_id_fkey(name)")
      .not("start_date", "is", null)
      .not("due_date", "is", null)
      .order("start_date")
      .then(({ data }) => {
        if (data) {
          setTasks(data.map((t) => ({
            id: t.id,
            title: t.title,
            start_date: t.start_date,
            due_date: t.due_date,
            status: t.status,
            project_name: (t.projects as unknown as { name: string } | null)?.name,
          })));
        }
      });
  }, []);

  if (tasks.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <p style={{ color: "var(--text-muted)" }}>No hay tareas con fechas definidas</p>
      </GlassCard>
    );
  }

  const dates = getDateRange(tasks);
  const dayCount = dates.length;
  const dayWidth = 40;
  const totalWidth = dayCount * dayWidth;

  return (
    <div className="animate-slideUp">
      <GlassCard className="p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Timeline de Tareas
        </h2>
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex mb-2" style={{ marginLeft: 250 }}>
            {dates.map((d, i) => (
              <div key={i} className="text-center text-xs shrink-0" style={{ width: dayWidth, color: "var(--text-muted)" }}>
                {d.getDate()}
              </div>
            ))}
          </div>

          {/* Rows */}
          {tasks.map((t) => {
            const start = new Date(t.start_date!).getTime();
            const end = new Date(t.due_date!).getTime();
            const firstDate = dates[0].getTime();
            const totalMs = dates[dates.length - 1].getTime() - firstDate || 1;

            const left = ((start - firstDate) / (dates[dates.length - 1].getTime() - firstDate)) * totalWidth;
            const width = Math.max(((end - start) / (dates[dates.length - 1].getTime() - firstDate)) * totalWidth, dayWidth);

            return (
              <div key={t.id} className="flex items-center h-9 mb-1">
                <div className="text-sm truncate shrink-0" style={{ width: 245, paddingRight: 5, color: "var(--text-primary)" }}>
                  {t.title}
                </div>
                <div className="relative flex-1" style={{ height: 20 }}>
                  <div className="absolute h-full rounded" style={{
                    left: left,
                    width: width,
                    background: getStatusColor(t.status),
                    opacity: 0.7,
                    minWidth: 8,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function getDateRange(tasks: TaskItem[]): Date[] {
  const allDates: Date[] = [];
  tasks.forEach((t) => {
    if (t.start_date) allDates.push(new Date(t.start_date));
    if (t.due_date) allDates.push(new Date(t.due_date));
  });
  if (allDates.length === 0) return [new Date()];

  const min = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const max = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const dates: Date[] = [];
  const current = new Date(min);
  while (current <= max) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "var(--accent-amber)",
    IN_PROGRESS: "var(--accent-cyan)",
    REVIEW: "var(--accent-purple)",
    COMPLETED: "var(--accent-green)",
    BLOCKED: "var(--accent-rose)",
  };
  return colors[status] || "var(--text-muted)";
}

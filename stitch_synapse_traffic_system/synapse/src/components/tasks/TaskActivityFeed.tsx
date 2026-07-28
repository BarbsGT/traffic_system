"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Clock } from "lucide-react";

interface HistoryEntry {
  id: string;
  task_id: string;
  changed_by: string;
  change_type: string;
  old_data: Record<string, unknown>;
  new_data: Record<string, unknown>;
  created_at: string;
  changed_by_name?: string;
  task_title?: string;
}

export function TaskActivityFeed({ taskId }: { taskId?: string }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let query = supabase
      .from("task_history")
      .select("*, profiles!task_history_changed_by_fkey(full_name), tasks!task_history_task_id_fkey(title)")

    if (taskId) {
      query = query.eq("task_id", taskId);
    }

    query.order("created_at", { ascending: false }).limit(50).then(({ data }) => {
      if (data) {
        setEntries(data.map((e) => ({
          id: e.id,
          task_id: e.task_id,
          changed_by: e.changed_by,
          change_type: e.change_type,
          old_data: e.old_data,
          new_data: e.new_data,
          created_at: e.created_at,
          changed_by_name: e.profiles?.full_name,
          task_title: e.tasks?.title,
        })));
      }
    });
  }, [taskId]);

  return (
    <div className="flex flex-col gap-2">
      {entries.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>Sin actividad reciente</p>
      ) : (
        entries.map((e) => (
          <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "var(--card-bg)" }}>
            <Clock size={14} style={{ color: "var(--text-muted)", marginTop: 2 }} />
            <div className="flex-1 text-sm">
              <span style={{ color: "var(--text-primary)" }}>{e.changed_by_name || "Sistema"}</span>
              <span style={{ color: "var(--text-secondary)" }}>
                {" "}{e.change_type === "INSERT" ? "creó" : "actualizó"}{" "}
              </span>
              {e.task_title && (
                <span className="font-medium" style={{ color: "var(--accent-cyan)" }}>{e.task_title}</span>
              )}
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {new Date(e.created_at).toLocaleString("es")}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

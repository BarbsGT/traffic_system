"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";

interface ProfileTask {
  profile_id: string;
  full_name: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  total: number;
}

export function TrafficMatrix() {
  const [profiles, setProfiles] = useState<ProfileTask[]>([]);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("tasks")
      .select("assignee_id, estimated_hours, profiles!tasks_assignee_id_fkey(full_name)")
      .not("assignee_id", "is", null)
      .then(({ data }) => {
        if (!data) return;
        const map = new Map<string, ProfileTask>();

        data.forEach((t) => {
          const pid = t.assignee_id;
          const name = (t.profiles as unknown as { full_name: string } | null)?.full_name || "Sin nombre";
          const hours = Number(t.estimated_hours) || 20;

          if (!map.has(pid)) {
            map.set(pid, {
              profile_id: pid,
              full_name: name,
              monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0,
              total: 0,
            });
          }

          const entry = map.get(pid)!;
          const perDay = Math.round(hours / 5);
          entry.monday += perDay;
          entry.tuesday += perDay;
          entry.wednesday += perDay;
          entry.thursday += perDay;
          entry.friday += perDay;
          entry.total += hours;
        });

        setProfiles(Array.from(map.values()));
      });
  }, []);

  const maxHours = Math.max(...profiles.map((p) => p.total), 1);

  return (
    <div className="animate-slideUp">
      <GlassCard className="p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Matriz de Carga Semanal
        </h2>
        <table className="w-full min-w-[600px]">
          <thead>
            <tr style={{ background: "var(--table-header)" }}>
              <th className="p-3 text-left text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Colaborador</th>
              {["Lun", "Mar", "Mié", "Jue", "Vie"].map((d) => (
                <th key={d} className="p-3 text-center text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>{d}</th>
              ))}
              <th className="p-3 text-center text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Total</th>
              <th className="p-3 text-center text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>Carga</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.profile_id} style={{ borderTop: "1px solid var(--divider)" }}>
                <td className="p-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.full_name}</td>
                <td className="p-3 text-sm text-center" style={{ color: getLoadColor(p.monday) }}>{p.monday}h</td>
                <td className="p-3 text-sm text-center" style={{ color: getLoadColor(p.tuesday) }}>{p.tuesday}h</td>
                <td className="p-3 text-sm text-center" style={{ color: getLoadColor(p.wednesday) }}>{p.wednesday}h</td>
                <td className="p-3 text-sm text-center" style={{ color: getLoadColor(p.thursday) }}>{p.thursday}h</td>
                <td className="p-3 text-sm text-center" style={{ color: getLoadColor(p.friday) }}>{p.friday}h</td>
                <td className="p-3 text-sm text-center font-semibold" style={{ color: "var(--text-primary)" }}>{p.total}h</td>
                <td className="p-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--divider)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(p.total / maxHours) * 100}%`, background: getBarColor(p.total) }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {profiles.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Sin datos de carga</p>
        )}
      </GlassCard>
    </div>
  );
}

function getLoadColor(hours: number): string {
  if (hours >= 8) return "var(--accent-rose)";
  if (hours >= 6) return "var(--accent-amber)";
  return "var(--accent-green)";
}

function getBarColor(total: number): string {
  if (total >= 40) return "var(--accent-rose)";
  if (total >= 30) return "var(--accent-amber)";
  return "var(--accent-green)";
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface TaskCount { status: string; count: number }
interface ProjectCount { priority: string; count: number }

const COLORS = ["#f59e0b", "#0ea5e9", "#8b5cf6", "#10b981", "#f43f5e"];

export function ExecutiveDashboard() {
  const [taskStats, setTaskStats] = useState<TaskCount[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectCount[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [blockedTasks, setBlockedTasks] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    supabase.from("tasks").select("status").then(({ data }) => {
      if (!data) return;
      setTotalTasks(data.length);
      setBlockedTasks(data.filter((t) => t.status === "BLOCKED").length);

      const counts = data.reduce<Record<string, number>>((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});
      setTaskStats(Object.entries(counts).map(([status, count]) => ({ status, count })));
    });

    supabase.from("projects").select("priority").then(({ data }) => {
      if (!data) return;
      setTotalProjects(data.length);
      const counts = data.reduce<Record<string, number>>((acc, p) => {
        acc[p.priority] = (acc[p.priority] || 0) + 1;
        return acc;
      }, {});
      setProjectStats(Object.entries(counts).map(([priority, count]) => ({ priority, count })));
    });
  }, []);

  const kpiData = [
    { label: "Total Proyectos", value: totalProjects, color: "var(--accent-cyan)" },
    { label: "Total Tareas", value: totalTasks, color: "var(--accent-purple)" },
    { label: "Bloqueadas", value: blockedTasks, color: "var(--accent-rose)" },
    { label: "Completadas", value: taskStats.find((t) => t.status === "COMPLETED")?.count || 0, color: "var(--accent-green)" },
  ];

  return (
    <div className="animate-slideUp">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {kpiData.map((kpi) => (
          <GlassCard key={kpi.label} className="p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{kpi.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Tareas por Estado</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={taskStats} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                {taskStats.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Proyectos por Prioridad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={projectStats}>
              <XAxis dataKey="priority" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { TrafficTable } from "@/components/traffic/TrafficTable";
import { HierarchyBrowser } from "@/components/traffic/HierarchyBrowser";
import { AnalyticsSidebar } from "@/components/traffic/AnalyticsSidebar";
import { CreateProjectModal } from "@/components/traffic/CreateProjectModal";
import { CreateTaskModal } from "@/components/traffic/CreateTaskModal";
import {
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  FolderKanban, Plus,
} from "lucide-react";

interface TrafficRow {
  id: string;
  agencyId: string;
  agencyName: string;
  accountId: string;
  accountName: string;
  projectId: string;
  projectName: string;
  taskTitle: string;
  status: string;
  assigneeId: string;
  assigneeName: string;
  estimatedHours: number;
  dueDate: string;
}

export default function TrafficPage() {
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const [selectedAgency, setSelectedAgency] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  const [allRows, setAllRows] = useState<TrafficRow[]>([]);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (profErr) {
        console.error("Profile query error:", profErr.message);
      }
      if (profile) {
        setRole(profile.role);
      } else {
        console.error("No profile found for user:", user.id, user.email);
      }
      setLoading(false);
    };
    load();
  }, [supabase]);

  const isDirector = role === "DIRECTOR" || role === "SUPERADMIN" || role === "SYSADMIN";

  const handleRowsLoaded = useCallback((rows: TrafficRow[]) => {
    setAllRows(rows);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="animate-fadeIn">
        <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Mesa de Tráfico Viva</h1>
        <div className="rounded-xl p-6" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <p className="text-sm mb-2" style={{ color: "var(--accent-rose)" }}>
            No se pudo cargar tu perfil. Tu usuario no tiene una fila en la tabla profiles.
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Ejecuta <code className="px-1 py-0.5 rounded" style={{ background: "var(--accordion-bg)" }}>fix_jose_complete.sql</code> en Supabase SQL Editor para crear tu perfil con rol SUPERADMIN.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Mesa de Tráfico Viva
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {role === "SUPERADMIN" || role === "SYSADMIN" ? "Vista global — todas las agencias" :
             role === "DIRECTOR" ? "Vista por cuentas asignadas — edita, asigna y prioriza" :
             "Vista personal — tus tareas asignadas"}
          </p>
        </div>

        {isDirector && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{ background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              <FolderKanban size={15} />
              Nuevo Proyecto
            </button>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "var(--accent-green)" }}
            >
              <Plus size={16} />
              Nueva Tarea
            </button>
          </div>
        )}
      </div>

      {/* 3-Column Layout */}
      <div className="flex gap-3" style={{ height: "calc(100vh - 140px)" }}>
        {/* Left: Hierarchy Browser */}
        {!leftCollapsed && (
          <div className="shrink-0 animate-fadeIn">
            <HierarchyBrowser
              rows={allRows}
              selectedAgency={selectedAgency}
              selectedAccount={selectedAccount}
              selectedProject={selectedProject}
              onSelectAgency={setSelectedAgency}
              onSelectAccount={setSelectedAccount}
              onSelectProject={setSelectedProject}
            />
          </div>
        )}

        {/* Center: Traffic Table */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Panel controls */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setLeftCollapsed(!leftCollapsed)}
              className="p-1.5 rounded-lg transition-all hover:opacity-70"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
              title={leftCollapsed ? "Mostrar jerarquía" : "Ocultar jerarquía"}
            >
              {leftCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
            <button
              onClick={() => setRightCollapsed(!rightCollapsed)}
              className="p-1.5 rounded-lg transition-all hover:opacity-70 ml-auto"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
              title={rightCollapsed ? "Mostrar analíticas" : "Ocultar analíticas"}
            >
              {rightCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <TrafficTable
              key={refreshKey}
              filterAgencyId={selectedAgency || undefined}
              filterAccountId={selectedAccount || undefined}
              filterProjectId={selectedProject || undefined}
              onRowsLoaded={handleRowsLoaded}
              isDirector={isDirector}
            />
          </div>
        </div>

        {/* Right: Analytics Sidebar */}
        {!rightCollapsed && (
          <div className="shrink-0 animate-fadeIn">
            <AnalyticsSidebar
              rows={allRows}
              collapsed={false}
              onToggle={() => setRightCollapsed(true)}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onCreated={handleRefresh}
      />
      <CreateTaskModal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onCreated={handleRefresh}
        defaultProjectId={selectedProject || undefined}
      />
    </div>
  );
}

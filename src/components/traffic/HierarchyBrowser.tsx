"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown, ChevronRight, Building2, Briefcase, FolderKanban, Hash,
} from "lucide-react";

interface TaskRow {
  agencyId: string;
  agencyName: string;
  accountId: string;
  accountName: string;
  projectId: string;
  projectName: string;
}

interface HierarchyBrowserProps {
  rows: TaskRow[];
  selectedAgency: string;
  selectedAccount: string;
  selectedProject: string;
  onSelectAgency: (id: string) => void;
  onSelectAccount: (id: string) => void;
  onSelectProject: (id: string) => void;
}

interface AgencyNode {
  id: string;
  name: string;
  taskCount: number;
  accounts: Map<string, {
    id: string;
    name: string;
    taskCount: number;
    projects: Map<string, { id: string; name: string; taskCount: number }>;
  }>;
}

const BRAND_COLORS = [
  "var(--accent-cyan)", "var(--accent-purple)", "var(--accent-green)",
  "var(--accent-amber)", "var(--accent-rose)", "var(--accent-blue)",
];

export function HierarchyBrowser({
  rows, selectedAgency, selectedAccount, selectedProject,
  onSelectAgency, onSelectAccount, onSelectProject,
}: HierarchyBrowserProps) {
  const [expandedAgencies, setExpandedAgencies] = useState<Set<string>>(new Set());
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const tree = useMemo(() => {
    const agencyMap = new Map<string, AgencyNode>();
    const colorMap = new Map<string, string>();
    let colorIdx = 0;

    for (const r of rows) {
      if (!r.agencyId) continue;
      if (!agencyMap.has(r.agencyId)) {
        agencyMap.set(r.agencyId, {
          id: r.agencyId, name: r.agencyName, taskCount: 0,
          accounts: new Map(),
        });
        colorMap.set(r.agencyId, BRAND_COLORS[colorIdx % BRAND_COLORS.length]);
        colorIdx++;
      }
      const agency = agencyMap.get(r.agencyId)!;
      agency.taskCount++;

      if (r.accountId) {
        if (!agency.accounts.has(r.accountId)) {
          agency.accounts.set(r.accountId, {
            id: r.accountId, name: r.accountName, taskCount: 0,
            projects: new Map(),
          });
        }
        const account = agency.accounts.get(r.accountId)!;
        account.taskCount++;

        if (r.projectId) {
          if (!account.projects.has(r.projectId)) {
            account.projects.set(r.projectId, { id: r.projectId, name: r.projectName, taskCount: 0 });
          }
          account.projects.get(r.projectId)!.taskCount++;
        }
      }
    }

    return { agencies: Array.from(agencyMap.values()).sort((a, b) => b.taskCount - a.taskCount), colorMap };
  }, [rows]);

  const toggleAgency = (id: string) => {
    setExpandedAgencies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    if (selectedAgency === id) onSelectAgency("");
    else {
      onSelectAgency(id);
      onSelectAccount("");
      onSelectProject("");
    }
  };

  const toggleAccount = (agencyId: string, accountId: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) next.delete(accountId); else next.add(accountId);
      return next;
    });
    if (selectedAccount === accountId) onSelectAccount("");
    else {
      onSelectAccount(accountId);
      onSelectProject("");
    }
  };

  const selectProject = (agencyId: string, accountId: string, projectId: string) => {
    onSelectAgency(agencyId);
    onSelectAccount(accountId);
    if (selectedProject === projectId) onSelectProject("");
    else onSelectProject(projectId);
  };

  const totalTasks = rows.length;

  return (
    <div
      className="rounded-xl overflow-hidden animate-fadeIn"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border)", minWidth: 220 }}
    >
      <div className="px-3 py-2.5" style={{ background: "var(--accordion-bg)" }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Jerarquía</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--divider)", color: "var(--text-muted)" }}>
            {totalTasks} tareas
          </span>
        </div>
      </div>

      {/* Reset button */}
      {(selectedAgency || selectedAccount || selectedProject) && (
        <button
          onClick={() => { onSelectAgency(""); onSelectAccount(""); onSelectProject(""); }}
          className="w-full px-3 py-1.5 text-[11px] font-medium transition-all"
          style={{ background: "rgba(14,165,233,0.08)", color: "var(--accent-cyan)", borderBottom: "1px solid var(--border)" }}
        >
          ← Ver todo
        </button>
      )}

      <div className="p-1 max-h-[calc(100vh-240px)] overflow-y-auto">
        {tree.agencies.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>Sin datos</p>
        ) : (
          tree.agencies.map((agency) => {
            const isExpanded = expandedAgencies.has(agency.id);
            const isSelected = selectedAgency === agency.id && !selectedAccount;
            const color = tree.colorMap.get(agency.id) || "var(--text-muted)";

            return (
              <div key={agency.id}>
                <button
                  onClick={() => toggleAgency(agency.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all"
                  style={{
                    background: isSelected ? "rgba(14,165,233,0.1)" : "transparent",
                    color: isSelected ? "var(--accent-cyan)" : "var(--text-primary)",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--accordion-bg)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </span>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <Building2 size={12} style={{ color: "var(--text-muted)" }} />
                  <span className="text-xs font-medium flex-1 truncate">{agency.name}</span>
                  <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{agency.taskCount}</span>
                </button>

                {isExpanded && (
                  <div className="ml-4">
                    {Array.from(agency.accounts.values()).sort((a, b) => b.taskCount - a.taskCount).map((account) => {
                      const isAccExpanded = expandedAccounts.has(account.id);
                      const isAccSelected = selectedAccount === account.id && !selectedProject;

                      return (
                        <div key={account.id}>
                          <button
                            onClick={() => toggleAccount(agency.id, account.id)}
                            className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all"
                            style={{
                              background: isAccSelected ? "rgba(14,165,233,0.08)" : "transparent",
                              color: isAccSelected ? "var(--accent-cyan)" : "var(--text-secondary)",
                            }}
                            onMouseEnter={(e) => { if (!isAccSelected) e.currentTarget.style.background = "var(--accordion-bg)"; }}
                            onMouseLeave={(e) => { if (!isAccSelected) e.currentTarget.style.background = "transparent"; }}
                          >
                            <span style={{ color: "var(--text-muted)" }}>
                              {isAccExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                            </span>
                            <Briefcase size={11} style={{ color: "var(--text-muted)" }} />
                            <span className="text-[11px] font-medium flex-1 truncate">{account.name}</span>
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{account.taskCount}</span>
                          </button>

                          {isAccExpanded && (
                            <div className="ml-4">
                              {Array.from(account.projects.values()).sort((a, b) => b.taskCount - a.taskCount).map((project) => {
                                const isProjSelected = selectedProject === project.id;
                                return (
                                  <button
                                    key={project.id}
                                    onClick={() => selectProject(agency.id, account.id, project.id)}
                                    className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all"
                                    style={{
                                      background: isProjSelected ? "rgba(14,165,233,0.06)" : "transparent",
                                      color: isProjSelected ? "var(--accent-cyan)" : "var(--text-muted)",
                                    }}
                                    onMouseEnter={(e) => { if (!isProjSelected) e.currentTarget.style.background = "var(--accordion-bg)"; }}
                                    onMouseLeave={(e) => { if (!isProjSelected) e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <FolderKanban size={10} style={{ color: "var(--text-muted)" }} />
                                    <span className="text-[10px] font-medium flex-1 truncate">{project.name}</span>
                                    <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{project.taskCount}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  FileText, CheckCircle2, AlertTriangle, Clock, MessageSquare, Save,
} from "lucide-react";

export type DeliveryTimeliness = "ON_TIME" | "LATE" | "AT_RISK" | "UNKNOWN";
export type ComplianceStatus = "APPROVED" | "PENDING" | "ISSUES" | "UNKNOWN";

interface TaskDetailData {
  taskId: string;
  description: string;
  deliveryTimeliness: DeliveryTimeliness;
  complianceStatus: ComplianceStatus;
  notes: string;
}

const DELIVERY_CONFIG: Record<DeliveryTimeliness, { label: string; color: string; bg: string }> = {
  ON_TIME:   { label: "A tiempo",     color: "var(--tag-green-text)",  bg: "var(--tag-green-bg)" },
  LATE:      { label: "Retrasado",    color: "var(--tag-rose-text)",   bg: "var(--tag-rose-bg)" },
  AT_RISK:   { label: "En riesgo",    color: "var(--tag-amber-text)",  bg: "var(--tag-amber-bg)" },
  UNKNOWN:   { label: "Sin evaluar",  color: "var(--text-muted)",      bg: "var(--divider)" },
};

const COMPLIANCE_CONFIG: Record<ComplianceStatus, { label: string; color: string; bg: string }> = {
  APPROVED:  { label: "Aprobado",      color: "var(--tag-green-text)",  bg: "var(--tag-green-bg)" },
  PENDING:   { label: "En revisión",   color: "var(--tag-blue-text)",   bg: "var(--tag-blue-bg)" },
  ISSUES:    { label: "Con issues",    color: "var(--tag-rose-text)",   bg: "var(--tag-rose-bg)" },
  UNKNOWN:   { label: "Sin evaluar",   color: "var(--text-muted)",      bg: "var(--divider)" },
};

const DELIVERY_OPTIONS: DeliveryTimeliness[] = ["ON_TIME", "LATE", "AT_RISK", "UNKNOWN"];
const COMPLIANCE_OPTIONS: ComplianceStatus[] = ["APPROVED", "PENDING", "ISSUES", "UNKNOWN"];

interface TaskDetailPanelProps {
  data: TaskDetailData;
  isDirector: boolean;
  onSave: (updated: TaskDetailData) => void;
}

export function TaskDetailPanel({ data, isDirector, onSave }: TaskDetailPanelProps) {
  const supabase = createClient();
  const [desc, setDesc] = useState(data.description);
  const [delivery, setDelivery] = useState<DeliveryTimeliness>(data.deliveryTimeliness);
  const [compliance, setCompliance] = useState<ComplianceStatus>(data.complianceStatus);
  const [notes, setNotes] = useState(data.notes);
  const [dirty, setDirty] = useState(false);

  const markDirty = useCallback(() => setDirty(true), []);

  const handleSave = useCallback(async () => {
    const updated = { ...data, description: desc, deliveryTimeliness: delivery, complianceStatus: compliance, notes };
    await supabase.from("tasks").update({
      description: desc,
      delivery_timeliness: delivery,
      compliance_status: compliance,
      notes,
    }).eq("id", data.taskId);
    onSave(updated);
    setDirty(false);
  }, [data, desc, delivery, compliance, notes, supabase, onSave]);

  return (
    <tr>
      <td colSpan={9} className="p-0">
        <div
          className="mx-2 mb-2 rounded-xl overflow-hidden animate-slideUp"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-2" style={{ background: "var(--accordion-bg)" }}>
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              <FileText size={13} />
              Detalle de Tarea
            </div>
            {isDirector && dirty && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                style={{ background: "var(--accent-green)" }}
              >
                <Save size={12} />
                Guardar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                <FileText size={11} />
                Descripción
              </label>
              {isDirector ? (
                <textarea
                  value={desc}
                  onChange={(e) => { setDesc(e.target.value); markDirty(); }}
                  placeholder="Describe los entregables y alcance de esta tarea..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-all"
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-cyan)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; }}
                />
              ) : (
                <div
                  className="px-3 py-2 rounded-lg text-sm min-h-[72px]"
                  style={{ background: "var(--accordion-bg)", color: desc ? "var(--text-primary)" : "var(--text-muted)" }}
                >
                  {desc || "Sin descripción"}
                </div>
              )}
            </div>

            {/* Evaluations */}
            <div className="space-y-3">
              {/* Delivery Timeliness */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <Clock size={11} />
                  Puntualidad
                </label>
                {isDirector ? (
                  <select
                    value={delivery}
                    onChange={(e) => { setDelivery(e.target.value as DeliveryTimeliness); markDirty(); }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium outline-none cursor-pointer"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                  >
                    {DELIVERY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{DELIVERY_CONFIG[opt].label}</option>
                    ))}
                  </select>
                ) : (
                  <span
                    className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: DELIVERY_CONFIG[delivery].bg, color: DELIVERY_CONFIG[delivery].color }}
                  >
                    {DELIVERY_CONFIG[delivery].label}
                  </span>
                )}
              </div>

              {/* Compliance */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <CheckCircle2 size={11} />
                  Cumplimiento
                </label>
                {isDirector ? (
                  <select
                    value={compliance}
                    onChange={(e) => { setCompliance(e.target.value as ComplianceStatus); markDirty(); }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium outline-none cursor-pointer"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                  >
                    {COMPLIANCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{COMPLIANCE_CONFIG[opt].label}</option>
                    ))}
                  </select>
                ) : (
                  <span
                    className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: COMPLIANCE_CONFIG[compliance].bg, color: COMPLIANCE_CONFIG[compliance].color }}
                  >
                    {COMPLIANCE_CONFIG[compliance].label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="px-4 pb-4 space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <MessageSquare size={11} />
              Notas de Mesa
            </label>
            {isDirector ? (
              <textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); markDirty(); }}
                placeholder="Notas de la mesa de tráfico, observaciones, decisiones..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-all"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-cyan)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--input-border)"; }}
              />
            ) : (
              <div
                className="px-3 py-2 rounded-lg text-sm min-h-[40px]"
                style={{ background: "var(--accordion-bg)", color: notes ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {notes || "Sin notas"}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChatPanel } from "@/components/ChatPanel";
import { MessageCircle, X } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

export function GlobalChatDrawer() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [unread, setUnread] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    supabase.from("projects").select("id, name").then(({ data }) => {
      if (data) {
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0].id);
        }
      }
    });
  }, [supabase, selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;
    const channel = supabase
      .channel("global-chat-count")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${selectedProject}` },
        () => {
          if (!open) setUnread((prev) => prev + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedProject, open, supabase]);

  return (
    <>
      {!open && (
        <button
          onClick={() => { setOpen(true); setUnread(0); }}
          className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg z-50 transition-all hover:scale-110"
          style={{ background: "var(--accent-cyan)", color: "#fff" }}
        >
          <MessageCircle size={24} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
              style={{ background: "var(--accent-rose)", color: "#fff" }}>
              {unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] glass flex flex-col z-50 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--card-border)" }}>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="text-sm font-medium bg-transparent border-none outline-none"
              style={{ color: "var(--text-primary)" }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 p-3 overflow-hidden">
            {selectedProject && <ChatPanel projectId={selectedProject} />}
          </div>
        </div>
      )}
    </>
  );
}

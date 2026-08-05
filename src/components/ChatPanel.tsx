"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { chunk } from "@/lib/utils";
import { Send, User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  profile_id: string;
  task_id: string | null;
  created_at: string;
  full_name?: string;
  avatar_url?: string;
}

interface Member {
  id: string;
  full_name: string;
  avatar_url: string;
}

export function ChatPanel({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const membersRef = useRef<Map<string, Member>>(new Map());
  membersRef.current = new Map(members.map((m) => [m.id, m]));
  const [input, setInput] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      const { data: msgs } = await supabase
        .from("project_messages")
        .select("*, profiles!project_messages_author_id_fkey(full_name, avatar_url)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (msgs) {
        setMessages(msgs.map((m) => ({
          id: m.id,
          content: m.content,
          profile_id: m.author_id,
          task_id: m.task_id,
          created_at: m.created_at,
          full_name: m.profiles?.full_name,
          avatar_url: m.profiles?.avatar_url,
        })));
      }

      const { data: taskData } = await supabase
        .from("tasks")
        .select("assignee_id")
        .eq("project_id", projectId)
        .not("assignee_id", "is", null);

      const assigneeIds = [...new Set(taskData?.map((t) => t.assignee_id as string).filter(Boolean))];
      const memberMap = new Map<string, Member>();
      if (assigneeIds.length > 0) {
        for (const batch of chunk(assigneeIds, 100)) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", batch);
          profiles?.forEach((p) => {
            memberMap.set(p.id, { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url || "" });
          });
        }
      }
      setMembers(Array.from(memberMap.values()));
    };

    load();

    const channel = supabase
      .channel(`chat-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${projectId}` },
        async (payload) => {
          const known = membersRef.current.get(payload.new.author_id);
          let full_name: string | undefined = known?.full_name;
          let avatar_url = known?.avatar_url || "";
          if (!known) {
            const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", payload.new.author_id).single();
            full_name = profile?.full_name;
            avatar_url = profile?.avatar_url || "";
          }
          setMessages((prev) => [...prev, {
            id: payload.new.id,
            content: payload.new.content,
            profile_id: payload.new.author_id,
            task_id: payload.new.task_id,
            created_at: payload.new.created_at,
            full_name,
            avatar_url,
          }]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, supabase]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    await supabase.from("project_messages").insert({
      project_id: projectId,
      author_id: user.user.id,
      content: input.trim(),
      task_id: taskFilter || null,
    });
    setInput("");
  };

  const displayedMessages = taskFilter ? messages.filter((m) => m.task_id === taskFilter) : messages;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex -space-x-2">
          {members.slice(0, 5).map((m) => (
            <div key={m.id} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--accent-cyan)", color: "#fff", border: "2px solid var(--card-bg)" }}>
              {m.full_name?.charAt(0) || "?"}
            </div>
          ))}
          {members.length > 5 && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
              style={{ background: "var(--glass-bg)", color: "var(--text-secondary)", border: "2px solid var(--card-bg)" }}>
              +{members.length - 5}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {displayedMessages.map((m) => (
          <div key={m.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "rgba(14,165,233,0.2)", color: "var(--accent-cyan)" }}>
              {m.full_name?.charAt(0) || "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{m.full_name || "Usuario"}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(m.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-lg px-3 py-2 text-sm"
          style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
        />
        <button onClick={sendMessage}
          className="p-2 rounded-lg"
          style={{ background: "var(--accent-cyan)", color: "#fff" }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

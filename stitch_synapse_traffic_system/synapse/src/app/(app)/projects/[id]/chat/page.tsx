"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChatPanel } from "@/components/ChatPanel";

export default function ProjectChatPage() {
  const params = useParams();
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (!params.id) return;
    createClient()
      .from("projects")
      .select("name")
      .eq("id", params.id)
      .single()
      .then(({ data }) => {
        if (data) setProjectName(data.name);
      });
  }, [params.id]);

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        Chat: {projectName || "Cargando..."}
      </h1>
      <GlassCard className="p-4 h-[calc(100vh-200px)]">
        <ChatPanel projectId={params.id as string} />
      </GlassCard>
    </div>
  );
}

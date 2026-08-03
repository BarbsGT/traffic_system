"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { SidebarNav } from "@/components/layout/SidebarNav";

const publicRoutes = ["/login", "/auth/callback"];

const adminOnlyRoutes = ["/dashboard"];

const adminRoles = ["SUPERADMIN", "SYSADMIN"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const currentUser = data.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        if (profile) setRole(profile.role);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="glass p-8 flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid" style={{ borderColor: "var(--accent-cyan)", borderTopColor: "transparent" }} />
          <span style={{ color: "var(--text-secondary)" }}>Cargando...</span>
        </div>
      </div>
    );
  }

  if (isPublic) {
    return <>{children}</>;
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  if (adminOnlyRoutes.some((r) => pathname.startsWith(r)) && !adminRoles.includes(role)) {
    if (typeof window !== "undefined") {
      window.location.href = "/projects";
    }
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav user={user} />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}

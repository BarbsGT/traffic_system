"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { SidebarNav } from "@/components/layout/SidebarNav";

const publicRoutes = ["/login", "/auth/callback"];

const adminOnlyRoutes = ["/dashboard", "/admin"];

const adminRoles = ["SUPERADMIN", "SYSADMIN"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(true);
  const [roleResolved, setRoleResolved] = useState(false);
  const profileAttempt = useRef(0);

  const fetchRole = useCallback(async (userId: string): Promise<void> => {
    const supabase = createClient();
    while (profileAttempt.current < 3) {
      profileAttempt.current += 1;
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (profile) {
        setRole(profile.role || "");
        setRoleResolved(true);
        return;
      }
      // Si la query falla por timing tras login, reintenta una vez más antes de decidir.
      if (error && profileAttempt.current < 3) {
        await new Promise((r) => setTimeout(r, 350));
        continue;
      }
      break;
    }
    setRoleResolved(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const currentUser = data.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchRole(currentUser.id);
      }
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        profileAttempt.current = 0;
        setRoleResolved(false);
        fetchRole(nextUser.id);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [fetchRole]);

  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  const needsAdminRole = adminOnlyRoutes.some((r) => pathname.startsWith(r));

  if (authLoading || (needsAdminRole && user && !roleResolved)) {
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

  if (needsAdminRole && !adminRoles.includes(role)) {
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

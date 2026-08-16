"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard, AlertTriangle, User, Settings, LogOut, Sun, Moon,
  Building2, Briefcase, BookOpen, Folder, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarHeader } from "./SidebarHeader";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const allNavItems: NavItem[] = [
  { label: "Panel General", href: "/dashboard", icon: <LayoutDashboard size={18} />, roles: ["SUPERADMIN", "SYSADMIN"] },
  { label: "Proyectos", href: "/projects", icon: <Folder size={18} /> },
  { label: "Dashboard Ejecutivo", href: "/projects/account-dashboard", icon: <Briefcase size={18} /> },
  { label: "Alertas y Recomendaciones", href: "/alerts", icon: <AlertTriangle size={18} /> },
  { label: "Perfil", href: "/profile", icon: <User size={18} /> },
  { label: "Catálogos", href: "/admin/catalogos", icon: <Settings size={18} />, roles: ["SUPERADMIN", "SYSADMIN"] },
  { label: "Usuarios", href: "/admin/users", icon: <Building2 size={18} />, roles: ["SUPERADMIN", "SYSADMIN"] },
  { label: "Guía de Uso", href: "/guias", icon: <BookOpen size={18} /> },
];

export function SidebarNav({ user, mobileOpen, onCloseMobile }: { user: { id: string }; mobileOpen: boolean; onCloseMobile: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isMobile) onCloseMobile();
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("profiles").select("role").eq("id", user.id).single().then(({ data }) => {
      if (data) setRole(data.role);
    });
  }, [user.id]);

  const items = allNavItems.filter((i) => !i.roles || i.roles.includes(role));

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={onCloseMobile}
        />
      )}
      <aside
        className="sidebar-glass flex flex-col h-full transition-all duration-300"
        style={{
          width: collapsed && !isMobile ? 64 : 240,
          position: isMobile ? "fixed" : "relative",
          left: 0,
          top: 0,
          zIndex: 50,
          transform: isMobile && !mobileOpen ? "translateX(-100%)" : "translateX(0)",
        }}
      >
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <SidebarHeader collapsed={collapsed && !isMobile} onToggle={() => setCollapsed(!collapsed)} />
          </div>
          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="flex items-center justify-center w-8 h-8 mr-3 shrink-0 rounded-lg"
              style={{ color: "var(--text-muted)" }}
              aria-label="Cerrar menú"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {items.map((item) => {
            const active = item.href === "/projects" ? pathname === "/projects" : pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all"
                style={{
                  background: active ? "rgba(255, 180, 170, 0.12)" : "transparent",
                  color: active ? "var(--accent-cyan)" : "var(--sidebar-text)",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--sidebar-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {item.icon}
                {(!collapsed || !isMobile) && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        <div className="border-t p-3 flex flex-col gap-2 shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all"
            style={{ color: "var(--sidebar-text)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sidebar-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            {(!collapsed || !isMobile) && <span>{theme === "light" ? "Oscuro" : "Claro"}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all"
            style={{ color: "var(--accent-rose)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sidebar-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={18} />
            {(!collapsed || !isMobile) && <span>Salir</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

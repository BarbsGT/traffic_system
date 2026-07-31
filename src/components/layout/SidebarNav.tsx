"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTheme } from "@/components/ThemeProvider";
import {
  LayoutDashboard, AlertTriangle, User, Settings, LogOut, Sun, Moon,
  ChevronLeft, ChevronRight, Building2, Briefcase, BookOpen,
} from "lucide-react";
import { useEffect, useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const allNavItems: NavItem[] = [
  { label: "Panel General", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Dashboard Ejecutivo", href: "/projects/account-dashboard", icon: <Briefcase size={18} /> },
  { label: "Alertas y Recomendaciones", href: "/alerts", icon: <AlertTriangle size={18} /> },
  { label: "Perfil", href: "/profile", icon: <User size={18} /> },
  { label: "Catálogos", href: "/admin/catalogos", icon: <Settings size={18} />, roles: ["SUPERADMIN", "SYSADMIN", "DIRECTOR"] },
  { label: "Usuarios", href: "/admin/users", icon: <Building2 size={18} />, roles: ["SUPERADMIN", "SYSADMIN"] },
  { label: "Guía de Uso", href: "/guias", icon: <BookOpen size={18} /> },
];

export function SidebarNav({ user }: { user: { id: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState<string>("");

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
    <aside
      className="sidebar-glass flex flex-col h-full transition-all duration-300"
      style={{ width: collapsed ? 64 : 240 }}
    >
      <div className="flex items-center gap-2 px-4 h-14 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {!collapsed && (
          <span className="font-bold text-sm tracking-wide" style={{ color: "var(--accent-cyan)" }}>
            AGENCYGRID
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:opacity-70"
          style={{ color: "var(--sidebar-text)" }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all"
              style={{
                background: active ? "rgba(14, 165, 233, 0.15)" : "transparent",
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
              {!collapsed && <span>{item.label}</span>}
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
          {!collapsed && <span>{theme === "light" ? "Oscuro" : "Claro"}</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all"
          style={{ color: "var(--accent-rose)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sidebar-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={18} />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
}

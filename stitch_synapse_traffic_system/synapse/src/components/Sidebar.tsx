"use client";

import { SidebarNav } from "@/components/layout/SidebarNav";

export function Sidebar({ user }: { user: { id: string } }) {
  return <SidebarNav user={user} />;
}

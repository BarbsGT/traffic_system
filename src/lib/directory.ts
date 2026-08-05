import { createClient } from "@/utils/supabase/client";

export interface Agency {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  agency_id?: string;
  code?: string;
}

export interface Team {
  id: string;
  name: string;
  code?: string;
}

export interface ProfileRef {
  id: string;
  full_name: string;
  avatar_url?: string | null;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  position: string;
  position_description: string;
  manager_id: string | null;
  capacity: number;
  is_active: boolean;
}

/** Carga las agencias (order por nombre). */
export async function loadAgencies(): Promise<Agency[]> {
  const { data } = await createClient().from("agencies").select("id, name").order("name");
  return (data as Agency[]) || [];
}

/** Carga las cuentas (order por nombre). */
export async function loadAccounts(): Promise<Account[]> {
  const { data } = await createClient().from("accounts").select("id, name, agency_id").order("name");
  return (data as Account[]) || [];
}

/** Carga los equipos (order por nombre). */
export async function loadTeams(): Promise<Team[]> {
  const { data } = await createClient().from("teams").select("id, name, code").order("name");
  return (data as Team[]) || [];
}

/** Carga todos los perfiles activos e inactivos (admin). */
export async function loadProfiles(): Promise<UserProfile[]> {
  const { data } = await createClient().from("profiles").select("*").order("full_name");
  return (data as UserProfile[]) || [];
}
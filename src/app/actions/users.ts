"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createServerClient } from "@/utils/supabase/server";

const VALID_ROLES = ["COLABORADOR", "DIRECTOR", "GERENTE", "SYSADMIN", "SUPERADMIN"] as const;
type Role = (typeof VALID_ROLES)[number];

export interface AccountAssignmentInput {
  account_id: string;
  manager_id: string | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: Role;
  position: string;
  position_description: string;
  manager_id: string | null;
  capacity: number;
  accounts: AccountAssignmentInput[];
  teams: string[];
}

async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const serverClient = await createServerClient();
  const { data: me } = await serverClient.auth.getUser();
  if (!me.user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await serverClient
    .from("profiles")
    .select("role")
    .eq("id", me.user.id)
    .single();

  if (!profile || (profile.role !== "SUPERADMIN" && profile.role !== "SYSADMIN")) {
    return { ok: false, error: "Solo SUPERADMIN/SYSADMIN pueden realizar esta operación" };
  }
  return { ok: true };
}

function validateCreateUserInput(input: CreateUserInput): { ok: true; email: string; password: string; full_name: string; capacity: number } | { ok: false; error: string } {
  const email = (input.email || "").trim();
  const password = input.password || "";
  const full_name = (input.full_name || "").trim();

  if (!full_name) return { ok: false, error: "El nombre es obligatorio" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Correo inválido" };
  if (password.length < 8) return { ok: false, error: "La contraseña debe tener al menos 8 caracteres" };
  if (!VALID_ROLES.includes(input.role)) return { ok: false, error: "Rol no válido" };

  const capacity = Math.max(0, Math.min(100, Number(input.capacity) || 100));
  return { ok: true, email, password, full_name, capacity };
}

async function createUserInternal(input: CreateUserInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const valid = validateCreateUserInput(input);
  if (!valid.ok) return valid;

  const admin = createAdminClient();

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: valid.email,
    password: valid.password,
    email_confirm: true,
    user_metadata: { full_name: valid.full_name },
  });

  if (authErr || !authData.user) {
    return { ok: false, error: authErr?.message || "No se pudo crear el usuario" };
  }

  const newUserId = authData.user.id;

  const { error: profileErr } = await admin.from("profiles").update({
    full_name: valid.full_name,
    role: input.role,
    position: input.position,
    position_description: input.position_description,
    manager_id: input.manager_id || null,
    capacity: valid.capacity,
    is_active: true,
  }).eq("id", newUserId);

  if (profileErr) {
    return { ok: false, error: `Perfil: ${profileErr.message}` };
  }

  const accountRows = (input.accounts || [])
    .filter((a) => a.account_id)
    .map((a) => ({ profile_id: newUserId, account_id: a.account_id, manager_id: a.manager_id || null }));

  if (accountRows.length > 0) {
    const { error: accErr } = await admin.from("profile_accounts").insert(accountRows);
    if (accErr) return { ok: false, error: `Cuentas: ${accErr.message}` };
  }

  const teamRows = (input.teams || [])
    .filter((t) => t)
    .map((team_id) => ({ profile_id: newUserId, team_id }));

  if (teamRows.length > 0) {
    const { error: teamErr } = await admin.from("profile_teams").insert(teamRows);
    if (teamErr) return { ok: false, error: `Equipos: ${teamErr.message}` };
  }

  return { ok: true };
}

export async function adminCreateUser(input: CreateUserInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const check = await assertAdmin();
    if (!check.ok) return check;
    return await createUserInternal(input);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
  }
}

export interface BulkCreateResult {
  ok: boolean;
  created: number;
  errors: { row: number; email: string; error: string }[];
}

export async function adminBulkCreateUsers(inputs: CreateUserInput[]): Promise<BulkCreateResult> {
  try {
    const check = await assertAdmin();
    if (!check.ok) return { ok: false, created: 0, errors: [{ row: 0, email: "", error: check.error }] };
    if (!inputs.length) return { ok: true, created: 0, errors: [] };

    const errors: BulkCreateResult["errors"] = [];
    let created = 0;

    for (let i = 0; i < inputs.length; i++) {
      const res = await createUserInternal(inputs[i]);
      if (res.ok) {
        created++;
      } else {
        errors.push({ row: i + 2, email: (inputs[i].email || "").trim(), error: res.error });
      }
    }

    return { ok: true, created, errors };
  } catch (e) {
    return { ok: false, created: 0, errors: [{ row: 0, email: "", error: e instanceof Error ? e.message : "Error inesperado" }] };
  }
}

export async function adminUpdateUser(
  id: string,
  input: {
    role: Role;
    position: string;
    position_description: string;
    manager_id: string | null;
    capacity: number;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const check = await assertAdmin();
    if (!check.ok) return check;
    if (!VALID_ROLES.includes(input.role)) return { ok: false, error: "Rol no válido" };

    const capacity = Math.max(0, Math.min(100, Number(input.capacity) || 100));

    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({
      role: input.role,
      position: input.position,
      position_description: input.position_description,
      manager_id: input.manager_id || null,
      capacity,
    }).eq("id", id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
  }
}

export async function adminToggleActive(id: string, isActive: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const check = await assertAdmin();
    if (!check.ok) return check;

    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ is_active: isActive }).eq("id", id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
  }
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  SYSADMIN: "Sys Admin",
  DIRECTOR: "Director",
  GERENTE: "Gerente",
  COLABORADOR: "Colaborador",
};

export function roleLabel(role: string | undefined | null): string {
  return (role && ROLE_LABELS[role]) || role || "";
}
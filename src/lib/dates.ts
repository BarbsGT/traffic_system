export function parseYMD(d: string | null | undefined): { y: number; m: number; day: number } | null {
  if (!d) return null;
  const parts = String(d).split("T")[0].split("-");
  if (parts.length !== 3) return null;
  const [y, m, day] = parts.map(Number);
  if (!y || !m || !day) return null;
  return { y, m, day };
}

export function formatDateDDMMYYYY(d: string | null | undefined) {
  const p = parseYMD(d);
  if (!p) return "";
  return `${String(p.day).padStart(2, "0")}/${String(p.m).padStart(2, "0")}/${p.y}`;
}

export function formatDateShort(d: string | null | undefined) {
  const p = parseYMD(d);
  if (!p) return "";
  return `${String(p.day).padStart(2, "0")}/${String(p.m).padStart(2, "0")}`;
}

export function toDateInputValue(d: string | null | undefined) {
  const p = parseYMD(d);
  if (!p) return "";
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/**
 * Convierte una fecha-only ("YYYY-MM-DD", como llega la columna `date` de
 * Supabase) a MEDIANOCHE LOCAL. NO usar new Date(iso): JS lo parsea como UTC,
 * y en zonas con offset negativo (Colombia UTC-5) cae a la tarde del día
 * anterior, corrompiendo los cálculos de vencimiento.
 */
export function localMidnight(d: string | null | undefined): Date | null {
  const p = parseYMD(d);
  if (!p) return null;
  return new Date(p.y, p.m - 1, p.day);
}

/** Medianoche local de hoy (inicio del día actual). */
export function startOfTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Días enteros entre una fecha-only y hoy (negativo = vencida). */
export function daysFromToday(d: string | null | undefined): number | null {
  const target = localMidnight(d);
  if (!target) return null;
  const today = startOfTodayLocal();
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

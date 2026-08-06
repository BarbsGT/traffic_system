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

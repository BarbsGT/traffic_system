"use client";

export interface CsvRow {
  [key: string]: string;
}

export function parseCSV(text: string): CsvRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        field = "";
        if (row.length > 1 || (row.length === 1 && row[0].trim() !== "")) {
          rows.push(row);
        }
        row = [];
      } else {
        field += ch;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.length > 1 || (row.length === 1 && row[0].trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const result: CsvRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const obj: CsvRow = {};
    headers.forEach((h, idx) => {
      obj[h] = (rows[i][idx] ?? "").trim();
    });
    if (Object.values(obj).some((v) => v !== "")) {
      result.push(obj);
    }
  }
  return result;
}

export function buildCSV(headers: string[], rows: string[][]): string {
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [headers.map(esc).join(",")];
  for (const r of rows) {
    lines.push(r.map(esc).join(","));
  }
  return lines.join("\n");
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function csvToBool(value: string, defaultValue: boolean): boolean {
  const v = value.trim().toLowerCase();
  if (v === "") return defaultValue;
  return ["1", "true", "si", "sí", "yes", "activo", "x"].includes(v);
}

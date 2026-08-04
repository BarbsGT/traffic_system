import { expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export interface AuditIssue {
  kind: 'pageerror' | 'console-error' | 'request-failed' | 'http-error';
  message: string;
  url?: string;
}

function loadEnvLocal(): Record<string, string> {
  const file = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return out;
}

export function getSupabaseAdmin() {
  const env = loadEnvLocal();
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: env.SUPABASE_SERVICE_ROLE_KEY || '',
  };
}

export function watchAuditIssues(page: Page) {
  const issues: AuditIssue[] = [];
  page.on('pageerror', (err) => issues.push({ kind: 'pageerror', message: err.message }));
  page.on('console', (msg) => {
    if (msg.type() === 'error') issues.push({ kind: 'console-error', message: msg.text() });
  });
  page.on('requestfailed', (req) =>
    issues.push({ kind: 'request-failed', message: req.failure()?.errorText || 'failed', url: req.url() })
  );
  page.on('response', (res) => {
    if (res.status() >= 500) issues.push({ kind: 'http-error', message: `${res.status()} ${res.statusText()}`, url: res.url() });
  });
  return issues;
}

export function expectNoAuditIssues(issues: AuditIssue[], context = '') {
  const prefix = context ? `${context}: ` : '';
  for (const issue of issues) {
    expect.soft(true, `${prefix}${issue.kind} — ${issue.message}${issue.url ? ` @ ${issue.url}` : ''}`).toBe(
      false,
    );
  }
  return issues;
}

export async function cleanupAuditProjects(prefix: string) {
  const { url, key } = getSupabaseAdmin();
  if (!url || !key) return;
  const res = await fetch(`${url}/rest/v1/projects?name=ilike.${encodeURIComponent(`${prefix}%`)}`, {
    method: 'DELETE',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
  });
  if (!res.ok && res.status !== 404) {
    console.log(`[cleanup] DELETE projects ${prefix}* -> ${res.status}`);
  }
}

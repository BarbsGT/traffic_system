import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

function loadEnvLocal(): Record<string, string> {
  const fs = require('fs');
  const path = require('path');
  const file = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return out;
}

const env = { ...process.env, ...loadEnvLocal() };

const DIRECTOR = { email: env.AUDIT_DIRECTOR_EMAIL || 'maria.pico@buentipo.com', password: env.AUDIT_DIRECTOR_PASSWORD || '' };
const SUPERADMIN = { email: env.AUDIT_SUPERADMIN_EMAIL || 'jose.rodriguez@lobueno.co', password: env.AUDIT_SUPERADMIN_PASSWORD || '' };

const authDir = path.join(__dirname, '.auth');
fs.mkdirSync(authDir, { recursive: true });

async function login(page: import('@playwright/test').Page, user: { email: string; password: string }, expectedPath: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**${expectedPath}`, { timeout: 30000 });
}

setup('guardar sesión director', async ({ page }) => {
  await login(page, DIRECTOR, '/projects');
  await page.context().storageState({ path: path.join(authDir, 'director.json') });
});

setup('guardar sesión superadmin', async ({ page }) => {
  await login(page, SUPERADMIN, '/dashboard');
  await page.context().storageState({ path: path.join(authDir, 'superadmin.json') });
});

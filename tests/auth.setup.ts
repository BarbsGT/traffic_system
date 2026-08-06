import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const DIRECTOR = { email: 'maria.pico@buentipo.com', password: 'D01_Bt_2026' };
const SUPERADMIN = { email: 'jose.rodriguez@lobueno.co', password: 'Test1234!' };

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

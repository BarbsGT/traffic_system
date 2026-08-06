import { test, expect, type Page } from '@playwright/test';
import { watchAuditIssues, expectNoAuditIssues } from './audit-helpers';

async function goDashboard(page: Page) {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });
}

test.describe('Auditoría flujo SUPERADMIN (josé)', () => {
  test('1. Login redirige a /dashboard y sidebar muestra rutas admin', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('link', { name: 'Panel General' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Usuarios' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Catálogos' })).toBeVisible();
    expectNoAuditIssues(issues, 'dashboard superadmin');
  });

  test('2. Dashboard carga KPIs y proyectos vencidos', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await goDashboard(page);
    await page.waitForTimeout(4000);
    for (const kpi of ['Proyectos Activos', 'Tareas Bloqueadas', 'Eficiencia Global', 'Alertas 48h']) {
      await expect(page.getByText(kpi)).toBeVisible();
    }
    expectNoAuditIssues(issues, 'KPIs dashboard');
  });

  test('3. Admin usuarios: tabla y tabs visibles', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await page.goto('/admin/users');
    await expect(page.getByRole('button', { name: 'Nuevo Usuario' })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('table')).toBeVisible();
    expectNoAuditIssues(issues, 'admin usuarios');
  });

  test('4. Admin catálogos: tabs Agencias/Cuentas/Equipos', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await page.goto('/admin/catalogos');
    await expect(page.getByRole('heading', { name: 'Catálogos' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Agencias')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cuentas', exact: true })).toBeVisible();
    await expect(page.getByText('Equipos')).toBeVisible();
    expectNoAuditIssues(issues, 'admin catálogos');
  });

  test('5. Account dashboard accesible para superadmin', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await page.goto('/projects/account-dashboard');
    await expect(page.locator('select').first()).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Matriz de Tráfico' }).click();
    await expect(page.getByRole('button', { name: '+Proyecto' })).toBeVisible({ timeout: 20000 });
    expectNoAuditIssues(issues, 'account dashboard superadmin');
  });

  test('6. Logout cierra sesión', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Salir' }).click();
    await page.waitForURL('**/login', { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

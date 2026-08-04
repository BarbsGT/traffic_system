import { test, expect, type Page } from '@playwright/test';
import { watchAuditIssues, expectNoAuditIssues, cleanupAuditProjects } from './audit-helpers';

const PREFIX = `AUDIT_${Date.now()}`;

async function ensureAccountDashboard(page: Page) {
  await page.goto('/projects/account-dashboard');
  await expect(page.locator('select').first()).toBeVisible({ timeout: 20000 });
}

test.describe('Auditoría flujo DIRECTOR (maria)', () => {
  test.afterAll(async () => {
    await cleanupAuditProjects(PREFIX);
  });

  test('1. Login redirige a /projects y sidebar oculta rutas admin', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole('link', { name: 'Dashboard Ejecutivo' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Alertas y Recomendaciones' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Proyectos' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Panel General' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Usuarios' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Catálogos' })).toHaveCount(0);
    expectNoAuditIssues(issues, 'sidebar director');
  });

  test('2. Director NO accede a /dashboard (redirige a /projects)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/projects', { timeout: 15000 });
    await expect(page).toHaveURL(/\/projects/);
  });

  test('3. Account dashboard: selector de cuenta carga opciones', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await ensureAccountDashboard(page);
    const select = page.locator('select').first();
    const options = await select.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
    expectNoAuditIssues(issues, 'selector de cuenta');
  });

  test('4. Tab Matriz de Tráfico carga tabla con proyectos', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await ensureAccountDashboard(page);
    await page.getByRole('button', { name: 'Matriz de Tráfico' }).click();
    await expect(page.getByRole('button', { name: '+Proyecto' })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('table')).toBeVisible();
    expectNoAuditIssues(issues, 'matriz de tráfico');
  });

  test('5. Crear proyecto como director (regresión RLS) y verlo en la matriz', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await ensureAccountDashboard(page);
    await page.getByRole('button', { name: 'Matriz de Tráfico' }).click();
    await page.getByRole('button', { name: '+Proyecto' }).click();

    const modal = page.locator('div.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h2', { hasText: 'Nuevo Proyecto' })).toBeVisible();

    const name = `${PREFIX}_PROY_5`;
    await modal.locator('input[type="text"]').first().fill(name);
    await modal.getByRole('button', { name: 'Crear Proyecto' }).click();

    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 20000 });
    expectNoAuditIssues(issues, 'crear proyecto');
  });

  test('6. Editar nombre del proyecto inline', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await ensureAccountDashboard(page);
    await page.getByRole('button', { name: 'Matriz de Tráfico' }).click();

    const oldName = `${PREFIX}_PROY_5`;
    const newName = `${PREFIX}_PROY_6_EDITADO`;
    await expect(page.getByText(oldName, { exact: true })).toBeVisible({ timeout: 20000 });

    await page.getByText(oldName, { exact: true }).click();
    const cellInput = page.locator('td input[type="text"]').filter({ visible: true }).first();
    await cellInput.fill(newName);
    await cellInput.press('Enter');

    await expect(page.getByText(newName, { exact: true })).toBeVisible({ timeout: 20000 });
    expectNoAuditIssues(issues, 'editar inline');
  });

  test('7. Página de Alertas carga sin errores', async ({ page }) => {
    const issues = watchAuditIssues(page);
    await page.goto('/alerts');
    await expect(page).toHaveURL(/\/alerts/);
    await page.waitForTimeout(3000);
    expectNoAuditIssues(issues, 'alerts');
  });

  test('8. Logout cierra sesión', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: 'Salir' }).click();
    await page.waitForURL('**/login', { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

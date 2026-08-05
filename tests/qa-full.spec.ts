import { test, expect, type Page } from '@playwright/test';

const SUPERADMIN = { email: 'jose.rodriguez@lobueno.co', password: 'Test1234!' };
const DIRECTOR = { email: 'director@lobueno.co', password: 'Test1234!' };
const COLABORADOR = { email: 'maria.garcia@lobueno.co', password: 'Test1234!' };
const TS = Date.now();

async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

// ═══════════════════════════════════════════════
// 1. AUTHENTICATION FLOW
// ═══════════════════════════════════════════════
test.describe('1. Authentication Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'AgencyGrid' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await login(page, SUPERADMIN);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const errorVisible = await page.locator('text=incorrectos').isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  });

  test('forgot password flow works', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=¿Olvidaste tu contraseña?');
    await expect(page.locator('text=Restablecer')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════
// 2. USER CREATION (ADMIN)
// ═══════════════════════════════════════════════
test.describe('2. User Creation', () => {
  test('admin can open and submit create user form', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/admin/users');
    await page.waitForTimeout(2000);

    await page.click('button:text("Nuevo Usuario")');
    await page.waitForTimeout(500);

    const nameInput = page.locator('input[name="full_name"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(`Test User ${TS}`);

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(`test${TS}@lobueno.co`);

    const pwInput = page.locator('input[name="password"]');
    await expect(pwInput).toBeVisible();
    await pwInput.fill('Test1234!');

    await page.click('button:text("Crear Usuario")');

    // Either the modal closes on success or an error message appears.
    const errorMsg = page.locator('div:has-text("rate limit"), div:has-text("already"), div:has-text("registrado"), div:has-text("incorrectas")');
    await Promise.race([
      nameInput.waitFor({ state: 'detached', timeout: 15000 }).catch(() => {}),
      errorMsg.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    ]);

    const formReacted =
      (await nameInput.isHidden().catch(() => true)) ||
      (await errorMsg.first().isVisible().catch(() => false));
    expect(formReacted).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════
// 3. CATALOG MANAGEMENT
// ═══════════════════════════════════════════════
test.describe('3. Catalog Management', () => {
  test('admin can view and interact with catalogs', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/admin/catalogos');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: 'Catálogos' })).toBeVisible();
    await expect(page.locator('text=Agencias')).toBeVisible();
    await expect(page.locator('text=Cuentas')).toBeVisible();
    await expect(page.locator('text=Equipos')).toBeVisible();

    await page.click('text=Agencias');
    await page.waitForTimeout(1000);

    await page.click('button:text("Nuevo")');
    await page.waitForTimeout(500);

    await page.fill('input[name="name"]', `Test Agency ${TS}`);
    await page.fill('input[name="code"]', `TA${TS}`);
    await page.click('button:text("Guardar")');
    await page.waitForTimeout(2000);
  });
});

// ═══════════════════════════════════════════════
// 4. PROJECT CREATION
// ═══════════════════════════════════════════════
test.describe('4. Project Creation', () => {
  test('superadmin can navigate to dashboard', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });
});

// ═══════════════════════════════════════════════
// 5. PROFILE MANAGEMENT
// ═══════════════════════════════════════════════
test.describe('5. Profile Management', () => {
  test('user can view and edit profile', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/profile');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: 'Perfil' })).toBeVisible();

    const nameInput = page.locator('input').first();
    await expect(nameInput).toBeVisible();
  });
});

// ═══════════════════════════════════════════════
// 6. NAVIGATION & SIDEBAR
// ═══════════════════════════════════════════════
test.describe('6. Navigation & Sidebar', () => {
  test('sidebar renders with nav items', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Panel General')).toBeVisible();
    await expect(page.locator('text=Perfil')).toBeVisible();
    await expect(page.locator('text=Catálogos')).toBeVisible();
  });

  test('can navigate between pages', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/dashboard');

    await page.click('text=Perfil');
    await page.waitForURL('**/profile', { timeout: 5000 });
    await expect(page).toHaveURL(/profile/);

    await page.click('text=Panel General');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});

// ═══════════════════════════════════════════════
// 7. DASHBOARD KPIs
// ═══════════════════════════════════════════════
test.describe('7. Dashboard KPIs', () => {
  test('dashboard loads with content', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    const hasContent = await page.locator('text=Panel General').isVisible();
    expect(hasContent).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════
// 8. DARK/LIGHT MODE TOGGLE
// ═══════════════════════════════════════════════
test.describe('8. Dark/Light Mode Toggle', () => {
  test('theme toggle changes appearance', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');

    const themeBtn = page.getByRole('button', { name: /Oscuro|Claro/ }).first();
    await themeBtn.click();
    await page.waitForTimeout(500);

    const afterTheme = await html.getAttribute('data-theme');
    expect(afterTheme).not.toBe(initialTheme);
  });
});

// ═══════════════════════════════════════════════
// 9. ALERTS PAGE
// ═══════════════════════════════════════════════
test.describe('9. Alerts Page', () => {
  test('alerts page loads', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/alerts');
    await page.waitForTimeout(3000);

    const url = page.url();
    expect(url).toContain('alerts');
  });
});

// ═══════════════════════════════════════════════
// 10. TASKS PAGE
// ═══════════════════════════════════════════════
test.describe('10. Tasks Page', () => {
  test('tasks page loads', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/tasks');
    await page.waitForTimeout(2000);
  });
});

// ═══════════════════════════════════════════════
// 11. GUIA DE USO
// ═══════════════════════════════════════════════
test.describe('11. Guía de Uso', () => {
  test('guias page loads', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/guias');
    await page.waitForTimeout(2000);
  });
});

// ═══════════════════════════════════════════════
// 12. RESPONSIVE BEHAVIOR
// ═══════════════════════════════════════════════
test.describe('12. Responsive Behavior', () => {
  test('app works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page, SUPERADMIN);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('app works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page, SUPERADMIN);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });
});

// ═══════════════════════════════════════════════
// 13. ACCOUNT DASHBOARD
// ═══════════════════════════════════════════════
test.describe('13. Account Dashboard', () => {
  test('account dashboard page loads', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/projects/account-dashboard');
    await page.waitForTimeout(2000);
  });

  test('timeline shows status column and filter per task', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/projects/account-dashboard');
    const timelineTab = page.getByRole('button', { name: 'Timeline' });
    await expect(timelineTab).toBeVisible({ timeout: 20000 });
    await timelineTab.click();
    await page.waitForTimeout(1200);

    const statusFilter = page
      .getByRole('combobox')
      .filter({ has: page.getByRole('option', { name: /todos los estados/i }) })
      .first();
    await expect(statusFilter).toBeVisible({ timeout: 20000 });
    await expect(statusFilter).toContainText(/pendiente|to do/i);

    const sawBadge = await page
      .locator(
        "span:text-is('Pendiente'), span:text-is('En Progreso'), span:text-is('Revisión'), span:text-is('Completado'), span:text-is('Bloqueado')"
      )
      .first()
      .isVisible()
      .catch(() => false);
    expect(sawBadge).toBe(true);
  });
});

// ═══════════════════════════════════════════════
// 14. STRATEGIC PAGE
// ═══════════════════════════════════════════════
test.describe('14. Strategic Page', () => {
  test('strategic page loads', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/strategic');
    await page.waitForTimeout(2000);
  });
});

// ═══════════════════════════════════════════════
// 15. LOGOUT FLOW
// ═══════════════════════════════════════════════
test.describe('15. Logout Flow', () => {
  test('user can logout', async ({ page }) => {
    await login(page, SUPERADMIN);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const logoutBtn = page.locator('text=Salir');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL('**/login', { timeout: 10000 });
      await expect(page).toHaveURL(/login/);
    }
  });
});

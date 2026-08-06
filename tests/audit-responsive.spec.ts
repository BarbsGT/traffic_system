import { test, expect, type Page } from '@playwright/test';
import { watchAuditIssues, expectNoAuditIssues } from './audit-helpers';

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 780 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1536', width: 1536, height: 864 },
];

const PROJECT_ID = '284e195b-600f-4f89-b67c-95f74228540d';

// Rutas autenticadas visibles para superadmin (las más pesadas en layout)
const ROUTES = [
  { path: '/projects', label: 'Proyectos' },
  { path: '/projects/account-dashboard', label: 'Dashboard Ejecutivo' },
  { path: '/alerts', label: 'Alertas' },
  { path: '/profile', label: 'Perfil' },
  { path: '/admin/catalogos', label: 'Catálogos' },
  { path: '/admin/users', label: 'Usuarios' },
  { path: '/strategic', label: 'Estratégico' },
  { path: '/tasks', label: 'Tareas' },
  { path: '/projects/' + PROJECT_ID, label: 'Proyecto detalle' },
  { path: '/projects/' + PROJECT_ID + '/chat', label: 'Chat proyecto' },
  { path: '/dashboard', label: 'Panel General' },
];

interface Overflow {
  docScrollW: number;
  docClientW: number;
  bodyScrollW: number;
  bodyClientW: number;
  mainScrollW: number | null;
  mainClientW: number | null;
}

async function measureOverflow(page: Page): Promise<Overflow> {
  return page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const main = document.querySelector('main');
    return {
      docScrollW: docEl.scrollWidth,
      docClientW: docEl.clientWidth,
      bodyScrollW: body.scrollWidth,
      bodyClientW: body.clientWidth,
      mainScrollW: main ? (main as HTMLElement).scrollWidth : null,
      mainClientW: main ? (main as HTMLElement).clientWidth : null,
    };
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`responsive @ ${vp.name} (${vp.width}px)`, () => {
    for (const route of ROUTES) {
      test(`${route.label} ${route.path} sin overflow horizontal`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const issues = watchAuditIssues(page);
        await page.goto(route.path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1200);

        const o = await measureOverflow(page);

        // Desplazamiento horizontal del documento (contenido que desborda el viewport)
        expect
          .soft(
            o.docScrollW <= o.docClientW,
            `overflujo docScrollW(${o.docScrollW}) > docClientW(${o.docClientW})`,
          )
          .toBe(true);
        expect
          .soft(
            o.bodyScrollW <= o.bodyClientW,
            `overflujo bodyScrollW(${o.bodyScrollW}) > bodyClientW(${o.bodyClientW})`,
          )
          .toBe(true);
        // Dentro del <main> el contenido no debe desbordar horizontalmente sin scroll
        if (o.mainScrollW != null && o.mainClientW != null) {
          expect
            .soft(
              o.mainScrollW <= o.mainClientW + 2,
              `overflujo mainScrollW(${o.mainScrollW}) > mainClientW(${o.mainClientW})`,
            )
            .toBe(true);
        }

        // No debe haber errores de runtime / consola / requests fallidos
        expectNoAuditIssues(issues, `${vp.name}/${route.path}`);
      });
    }
  });
}
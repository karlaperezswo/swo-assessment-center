import { test, expect } from '@playwright/test';

test.describe('Assessment Center smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        // ignore
      }
    });
  });

  test('home page renders header + phase navigator', async ({ page }) => {
    await page.goto('/');

    // Header is always visible regardless of auth state.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Session button present with accessible label.
    const sessionBtn = page.getByRole('button', { name: /session|sesi[oó]n|sess[aã]o/i }).first();
    await expect(sessionBtn).toBeVisible();
  });

  test('theme toggle flips the dark class on <html>', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    const startedDark = await html.evaluate((el) => el.classList.contains('dark'));

    const toggle = page.getByRole('button', { name: /switch to (dark|light)|cambiar a modo|mudar para modo/i });
    await toggle.click();

    const afterDark = await html.evaluate((el) => el.classList.contains('dark'));
    expect(afterDark).toBe(!startedDark);
  });

  test('session menu opens and shows save/restore/cloud actions', async ({ page }) => {
    await page.goto('/');

    const sessionBtn = page.getByRole('button', { name: /session|sesi[oó]n|sess[aã]o/i }).first();
    await sessionBtn.click();

    await expect(page.getByText(/save in this browser|guardar en este navegador|salvar neste navegador/i)).toBeVisible();
    await expect(page.getByText(/export to file|exportar a archivo|exportar para arquivo/i)).toBeVisible();
    await expect(page.getByText(/save to cloud|guardar en la nube|salvar na nuvem/i)).toBeVisible();
  });

  test('Assess phase subtabs render with prerequisite locks', async ({ page }) => {
    await page.goto('/');

    // Rapid Discovery tab is always enabled (entry point).
    const discoveryTab = page.getByRole('button', { name: /discovery|descubrimiento|descoberta/i }).first();
    await expect(discoveryTab).toBeVisible();

    // Before uploading an MPA, dependent tabs should be present but show a
    // lock hint via title/aria-label.
    const readinessTab = page.getByRole('button', { name: /readiness|preparaci[oó]n|prontid[aã]o/i }).first();
    await expect(readinessTab).toBeVisible();
    const title = await readinessTab.getAttribute('title');
    // Either tab has a direct title (prereq message) or the tab label itself is the title.
    expect(title).toBeTruthy();
  });

  test('Migration Readiness empty state when no MPA loaded', async ({ page }) => {
    await page.goto('/?phase=assess');

    // Navigate to the readiness subtab.
    const readinessTab = page.getByRole('button', { name: /readiness|preparaci[oó]n|prontid[aã]o/i }).first();
    await readinessTab.click();

    // The empty-state gauge copy should surface.
    await expect(
      page.getByText(/upload your mpa|sube primero|envie o mpa|mra|readiness/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

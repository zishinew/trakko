import { test, expect } from '@playwright/test';

test('motion controls and account navigation fit narrow phones', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const login = page.getByRole('link', { name: 'Log in', exact: true });
    await expect(login).toBeVisible();
    const box = await login.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.getByRole('button', { name: 'Pause visual effects' }).click();
    await expect(page.getByRole('button', { name: 'Resume visual effects' })).toBeVisible();
  }
});

test('both shaders render and the shared pause control freezes effects without stopping audio', async ({
  page,
}) => {
  await page.goto('/');
  const flow = page.locator('.shader-flow');
  const ripple = page.locator('.shader-ripple');
  await expect(flow).toHaveAttribute('data-render-state', 'running');
  await page.getByRole('button', { name: 'Pause visual effects' }).click();
  await expect(flow).toHaveAttribute('data-render-state', 'paused');
  await expect(ripple).toHaveAttribute('data-render-state', 'paused');
  await page.locator('.signal-stage').hover();
  await page.getByRole('button', { name: 'Play hero preview: eyesight', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Pause hero preview: eyesight', exact: true }),
  ).toBeVisible();
  await expect(flow).toHaveAttribute('data-render-state', 'paused');
  await page.getByRole('button', { name: 'Resume visual effects' }).click();
  await expect(flow).toHaveAttribute('data-render-state', 'running');
  await ripple.scrollIntoViewIfNeeded();
  await expect(ripple).toHaveAttribute('data-render-state', 'running');
  await expect(flow).toHaveAttribute('data-render-state', 'offscreen');
});

test('reduced motion renders static shaders and keeps controls usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.shader-flow')).toHaveAttribute('data-render-state', 'reduced');
  await expect(page.getByRole('button', { name: 'Reduced motion enabled' })).toBeDisabled();
  expect(
    await page.locator('.signal-drift').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await page.getByRole('link', { name: 'Create your free store' }).click();
  await expect(page).toHaveURL(/\/signup$/);
});

test('WebGL failure leaves the static daylight page and music usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (type: string, ...args: unknown[]) {
        return type === 'webgl' ? null : Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  await page.goto('/');
  await expect(page.locator('.shader-flow')).toHaveAttribute('data-render-state', 'fallback');
  await expect(page.getByRole('heading', { name: 'Your beats. Your business.' })).toBeVisible();
  await page.locator('.signal-stage').hover();
  await page.getByRole('button', { name: 'Play hero preview: eyesight', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Pause hero preview: eyesight', exact: true }),
  ).toBeVisible();
});

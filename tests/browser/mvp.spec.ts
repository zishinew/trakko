import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('storefront player, guest purchase, private downloads and dashboard revenue', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your beats. Your business.' })).toBeVisible();
  await page.screenshot({
    caret: 'initial',
    path: 'test-results/landing-desktop.png',
    fullPage: true,
  });
  await page.goto('/ziova');
  await expect(page.getByRole('heading', { name: 'Find your frequency.' })).toBeVisible();
  await page.screenshot({
    caret: 'initial',
    path: 'test-results/store-desktop.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Play eyesight', exact: true }).first().click();
  await expect
    .poll(() =>
      page.locator('audio').evaluate((a: HTMLAudioElement) => !a.paused && a.currentTime > 0),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Play after hours', exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator('audio')
        .evaluate((a: HTMLAudioElement) => a.currentSrc.endsWith('preview-2.mp3') && !a.paused),
    )
    .toBe(true);
  expect(await page.locator('audio').count()).toBe(1);
  await expect
    .poll(async () =>
      Number(await page.getByRole('slider', { name: 'Seek preview' }).getAttribute('max')),
    )
    .toBeGreaterThan(5);
  await page.getByRole('slider', { name: 'Seek preview' }).fill('5');
  await expect
    .poll(() => page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime >= 5))
    .toBe(true);
  await page.getByRole('button', { name: 'Close player' }).click();
  await page.getByRole('textbox', { name: 'Search beats' }).fill('velvet');
  await expect(page.locator('.beat-row')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Search beats' }).fill('');
  await page.locator('.beat-row').first().getByRole('button', { name: '$19.99' }).click();
  await page.getByLabel('WAV Lease').check();
  await page.getByRole('textbox', { name: 'Your email' }).fill('artist@example.com');
  await page.getByRole('button', { name: 'Complete demo purchase' }).click();
  await expect(page.getByRole('heading', { name: 'It’s yours. Make something.' })).toBeVisible();
  const purchase = new URL(page.url()),
    id = purchase.pathname.split('/').pop()!,
    token = purchase.searchParams.get('token')!;
  await page.screenshot({
    caret: 'initial',
    path: 'test-results/purchase-desktop.png',
    fullPage: true,
  });
  for (const kind of ['mp3', 'wav', 'license']) {
    const r = await page.request.get(`/api/purchases/${id}?token=${token}&download=${kind}`);
    expect(r.status()).toBe(200);
    expect((await r.body()).length).toBeGreaterThan(100);
  }
  expect(
    (await page.request.get(`/api/purchases/${id}?token=${token}&download=stems`)).status(),
  ).toBe(403);
  expect((await request.get(`/api/purchases/${id}?token=${'0'.repeat(64)}`)).status()).toBe(404);
  const receipt = await (await page.request.get(`/api/purchases/${id}?token=${token}`)).json();
  expect(receipt.files).toBeUndefined();
  expect(receipt.token_hash).toBeUndefined();
  await page.goto('/dashboard');
  await expect(page.locator('.stat-card').first()).toContainText('$29.99');
  await expect(page.locator('.stat-card').first()).toContainText('$27.59');
  await expect(page.locator('.stat-card').nth(2)).toContainText('2');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.dashboard')).toBeVisible();
  await page.screenshot({
    caret: 'initial',
    path: 'test-results/dashboard-desktop.png',
    fullPage: true,
  });
  await page.goto('/dashboard/orders');
  await expect(page.getByText('artist@example.com', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'artist@example.com eyesight' }).click();
  await expect(page.getByRole('dialog')).toContainText('$2.40');
  await page.goto('/dashboard/settings');
  await expect(page.getByText('8% per completed sale', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('producer can upload, configure licenses, publish, customize and unpublish', async ({
  page,
}) => {
  await page.goto('/signup');
  await page.getByRole('button', { name: 'Enter demo workspace' }).click();
  await page.getByLabel('Display name', { exact: true }).fill('Nightshift');
  await page.getByLabel('Store URL').fill('nightshift');
  await page.getByRole('button', { name: 'Create your store' }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.goto('/dashboard/beats');
  await page.getByRole('button', { name: 'Upload beat', exact: true }).click();
  await page.getByLabel('Beat title').fill('midnight test');
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page.getByRole('dialog')).toContainText('Edit midnight test');
  await page
    .locator('.upload-box')
    .filter({ hasText: 'Tagged preview' })
    .locator('input')
    .setInputFiles({
      name: 'preview.mp3',
      mimeType: 'audio/mpeg',
      buffer: await readFile('public/demo/preview-1.mp3'),
    });
  await expect(page.getByRole('status')).toContainText('PREVIEW uploaded.');
  await page
    .locator('.upload-box')
    .filter({ hasText: 'Untagged MP3' })
    .locator('input')
    .setInputFiles({
      name: 'untagged.mp3',
      mimeType: 'audio/mpeg',
      buffer: await readFile('demo-private/sample.mp3'),
    });
  await expect(page.getByRole('status')).toContainText('MP3 uploaded.');
  for (const name of ['WAV Lease', 'Trackout Lease']) {
    await page.getByRole('button', { name: new RegExp(name) }).click();
    await page.getByRole('checkbox', { name: 'Active · available to purchase' }).uncheck();
    await page.getByRole('button', { name: 'Save license' }).click();
  }
  await page.getByRole('button', { name: 'Publish beat', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Beat published.');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.goto('/nightshift');
  await expect(
    page.getByRole('heading', { name: 'midnight test', exact: true }).first(),
  ).toBeVisible();
  await page.goto('/dashboard/store');
  await page.getByLabel('Bio (optional)').fill('Original sounds after sunset.');
  await page.getByRole('button', { name: 'Daylight', exact: true }).click();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Your store is updated.');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    caret: 'initial',
    path: 'test-results/store-editor-desktop.png',
    fullPage: true,
  });
  await page.goto('/nightshift');
  await expect(page.getByText('Original sounds after sunset.')).toBeVisible();
  await expect(page.locator('.storefront')).toHaveClass(/theme-light/);
  await page.goto('/dashboard/beats');
  await page
    .locator('.library-card')
    .filter({ hasText: 'midnight test' })
    .getByRole('button', { name: 'Unpublish' })
    .click();
  await expect(page.locator('.library-card').filter({ hasText: 'midnight test' })).toContainText(
    'Draft',
  );
  await page.goto('/nightshift');
  await expect(page.getByRole('heading', { name: 'midnight test', exact: true })).toHaveCount(0);
});
test('mobile storefront and navigation fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    '/',
    '/ziova',
    '/dashboard',
    '/dashboard/beats',
    '/dashboard/orders',
    '/dashboard/store',
    '/dashboard/settings',
    '/login',
    '/reset-password',
  ]) {
    await page.goto(path);
    await expect(page.locator('main, .store-main').first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `overflow on ${path}`).toBe(false);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      caret: 'initial',
      path: `test-results/mobile-${path.replaceAll('/', '-') || 'landing'}.png`,
      fullPage: true,
    });
  }
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.locator('.sidebar').getByRole('link', { name: 'Orders', exact: true }).click();
  await expect(page).toHaveURL('/dashboard/orders');
});

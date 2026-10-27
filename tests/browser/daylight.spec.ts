import { expect, test } from '@playwright/test';

test('the listening room plays, seeks and switches real previews', async ({ page }) => {
  await page.goto('/');
  await page.locator('.signal-stage').hover();
  await page.getByRole('button', { name: 'Play hero preview: eyesight', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Pause hero preview: eyesight', exact: true }),
  ).toBeVisible();
  const seek = page.getByRole('slider', { name: 'Seek hero preview: eyesight' });
  await expect(seek).toBeEnabled();
  await seek.focus();
  await seek.press('ArrowRight');
  await expect
    .poll(() => page.locator('audio').evaluate((el) => (el as HTMLAudioElement).currentTime))
    .toBeGreaterThan(0);
  await page
    .getByRole('group', { name: 'Choose a demo track' })
    .getByRole('button', { name: 'after hours' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Pause hero preview: after hours', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Pause hero preview: after hours', exact: true }).click();
  await page.getByRole('link', { name: 'Create your free store' }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole('heading', { name: 'Your sound starts here.' })).toBeVisible();
});

test('reduced motion retains a static, readable daylight hero', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your beats. Your business.' })).toBeVisible();
  expect(
    await page
      .locator('.title-line > span')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await page.locator('.signal-stage').hover();
  expect(
    await page.locator('.signal-console').evaluate((el) => getComputedStyle(el).transform),
  ).toBe('none');
  await page.locator('.signal-stage').hover();
  await page.getByRole('button', { name: 'Play hero preview: eyesight', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Pause hero preview: eyesight', exact: true }),
  ).toBeVisible();
});

test('the homepage and signup link remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(process.env.TEST_BASE_URL || 'http://localhost:3000');
  await expect(page.getByRole('heading', { name: 'Your beats. Your business.' })).toBeVisible();
  await expect(page.locator('.signal-track-name strong')).toHaveText('eyesight');
  await page.getByRole('link', { name: 'Create your free store' }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await context.close();
});

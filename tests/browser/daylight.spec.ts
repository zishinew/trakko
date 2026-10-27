import { expect, test } from '@playwright/test';

test('daylight hero loads its illustration and keeps the signup path available', async ({
  page,
}) => {
  await page.goto('/');
  const illustration = page.getByRole('img', { name: /Soft lavender headphones/ });
  await expect(illustration).toBeVisible();
  await expect
    .poll(() => illustration.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
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
  await expect(page.getByRole('img', { name: /Soft lavender headphones/ })).toBeVisible();
  await page.getByRole('link', { name: 'Take a look around' }).click();
  await expect(page).toHaveURL(/\/ziova$/);
  await expect(page.getByRole('heading', { name: 'Find your frequency.' })).toBeVisible();
});

test('the homepage and signup link remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(process.env.TEST_BASE_URL || 'http://localhost:3000');
  await expect(page.getByRole('heading', { name: 'Your beats. Your business.' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Soft lavender headphones/ })).toBeVisible();
  await page.getByRole('link', { name: 'Create your free store' }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await context.close();
});

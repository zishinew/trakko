import { expect, test } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`hero windows support keyboard licensing and workspace navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const license = page
      .locator('.hero-showcase')
      .getByRole('link', { name: 'View licenses for eyesight', exact: true });
    await license.focus();
    await expect(license).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/ziova\?beat=/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('eyesight');
    await page.goto('/');
    const workspace = page.getByRole('link', { name: 'Explore the producer workspace demo' });
    await workspace.focus();
    await expect(workspace).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard\/beats$/);
    await expect(page.getByRole('heading', { name: 'Your beats.', exact: true })).toBeVisible();
  });
}

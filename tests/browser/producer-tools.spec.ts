import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { demoWorkspace } from '../../src/lib/demo-data';
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const fixture = demoWorkspace();
test('producer promotions, lead capture, bundle licenses, collaborator ledger and source analytics', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/dashboard/collaborators');
  await page.getByLabel('Collaborator name').fill('Nova');
  await page.getByLabel('Collaborator email').fill('nova@example.com');
  await page.getByLabel('Share of producer earnings (%)').fill('25');
  await page.getByRole('button', { name: 'Add collaborator', exact: true }).click();
  await expect(page.getByText('Collaborator splits saved.')).toBeVisible();
  await page.goto('/dashboard/promotions');
  await page.getByLabel('Discount code', { exact: true }).fill('LAUNCH20');
  await page.getByLabel('Discount percentage').fill('20');
  await page.getByRole('button', { name: 'Create discount code' }).click();
  await expect(page.getByText('LAUNCH20 / 20% off')).toBeVisible();
  await page.getByLabel('Bundle name').fill('Night pair');
  await page.getByLabel('Bundle price USD').fill('30');
  await page.getByLabel('eyesight', { exact: true }).check();
  await page.getByLabel('after hours', { exact: true }).check();
  await page.getByRole('button', { name: 'Create bundle' }).click();
  await expect(page.getByText('Night pair / $30.00')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: 'test-results/promotions-desktop.png',
    fullPage: true,
    caret: 'initial',
  });
  await page.goto('/dashboard/beats');
  await page.getByRole('button', { name: 'Edit eyesight', exact: true }).first().click();
  await page.getByLabel('Offer tagged preview as a free download').check();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText('Beat saved.')).toBeVisible();
  await page.goto('/ziova?utm_source=instagram');
  await page.getByRole('button', { name: 'Free preview download' }).click();
  await page.getByLabel('Email for free download').fill('listener@example.com');
  await page.getByLabel('I accept these free download terms').check();
  await page.getByRole('button', { name: 'Get free preview' }).click();
  await expect(
    page.getByText('You have not subscribed to marketing.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download tagged MP3' })).toHaveAttribute(
    'href',
    /preview-1.mp3/,
  );
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'View bundle / $30.00' }).click();
  await page.getByLabel('Discount code (optional)').fill('LAUNCH20');
  await page.getByRole('button', { name: 'Apply code' }).click();
  await expect(page.getByText('Total: $24.00', { exact: false })).toBeVisible();
  await page.getByLabel('Your email').fill('buyer@example.com');
  await page.getByRole('button', { name: 'Complete demo purchase' }).click();
  await expect(page.getByRole('heading', { name: 'It’s yours. Make something.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'eyesight / MP3' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'after hours / MP3' })).toBeVisible();
  for (const title of ['eyesight', 'after hours']) {
    const href = await page.getByRole('link', { name: `${title} / MP3` }).getAttribute('href');
    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-disposition']).toContain(title.replace(' ', '-'));
  }
  const u = new URL(page.url());
  const receipt = await (
    await page.request.get(
      `/api/purchases/${u.pathname.split('/').pop()}?token=${u.searchParams.get('token')}`,
    )
  ).json();
  expect(receipt.items).toHaveLength(2);
  expect(receipt.discount_cents).toBe(600);
  expect(receipt.fee_cents).toBe(192);
  expect(receipt.earnings_cents).toBe(2208);
  expect(receipt.receipt_ciphertext).toBeUndefined();
  expect(receipt.items.every((i: { splits: unknown[] }) => i.splits.length === 0)).toBe(true);
  const invalid = await page.request.get(
    `/api/purchases/${receipt.id}?token=${u.searchParams.get('token')}&download=mp3&file=ffffffff-ffff-4fff-8fff-ffffffffffff`,
  );
  expect(invalid.status()).toBe(403);
  await page.goto('/dashboard/audience');
  await expect(page.getByRole('cell', { name: 'listener@example.com', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Download only', exact: true })).toBeVisible();
  await expect(page.getByText('Demo preview', { exact: true })).toBeVisible();
  const csv = await page.request.get('/api/tools?export=contacts');
  expect(await csv.text()).toContain('listener@example.com');
  await page.goto('/dashboard/collaborators');
  await expect(page.getByRole('heading', { name: 'Amounts owed' })).toBeVisible();
  await expect(page.getByText('$0.00', { exact: true })).toHaveCount(0);
  const ledger = await page.request.get('/api/tools?export=splits');
  expect(await ledger.text()).toContain('nova@example.com');
  await page.goto('/dashboard/analytics');
  await expect(page.getByRole('cell', { name: 'instagram', exact: true })).toBeVisible();
  await page.screenshot({
    path: 'test-results/analytics-desktop.png',
    fullPage: true,
    caret: 'initial',
  });
  expect(errors).toEqual([]);
});
test('scheduled releases stay unavailable for catalog, free downloads, quotes and checkout until released', async ({
  page,
}) => {
  await page.goto('/ziova');
  const b = fixture.beats[0],
    l = fixture.licenses.find((l) => l.beat_id === b.id)!;
  const future = new Date(Date.now() + 86400000).toISOString();
  const update = async (release_at: string) =>
    page.request.post('/api/manage', {
      headers: { origin: base },
      data: { action: 'beat', id: b.id, data: { ...b, release_at, free_download: true } },
    });
  expect((await update(future)).ok()).toBe(true);
  await page.reload();
  await expect(page.locator('.beat-row').filter({ hasText: 'eyesight' })).toHaveCount(0);
  for (const path of ['/api/quote', '/api/checkout'])
    expect(
      (
        await page.request.post(path, {
          headers: { origin: base },
          data: { beat_id: b.id, license_id: l.id, email: 'artist@example.com' },
        })
      ).ok(),
    ).toBe(false);
  expect(
    (
      await page.request.post('/api/free-download', {
        headers: { origin: base },
        data: {
          username: 'ziova',
          beat_id: b.id,
          email: 'artist@example.com',
          marketing_consent: false,
          accept_terms: true,
        },
      })
    ).ok(),
  ).toBe(false);
  expect((await update(new Date(Date.now() - 1000).toISOString())).ok()).toBe(true);
  await page.reload();
  await expect(page.locator('.beat-row').filter({ hasText: 'eyesight' })).toHaveCount(1);
  await page.goto('/dashboard/beats');
  await page.getByRole('button', { name: 'Edit eyesight', exact: true }).first().click();
  await expect(page.getByLabel('Release date and time')).not.toHaveValue('');
  expect((await page.request.get('/api/jobs/receipts')).status()).toBe(401);
});
test('bulk uploads create complete beats and bulk edits update selected catalog entries', async ({
  page,
}) => {
  await page.goto('/dashboard/beats');
  await page.getByRole('button', { name: 'Bulk upload', exact: true }).click();
  const audio = await readFile('public/demo/preview-1.mp3');
  const payload = (name: string) => ({ name, mimeType: 'audio/mpeg', buffer: audio });
  await page
    .getByLabel('Preview MP3 files')
    .setInputFiles([payload('nova_preview.mp3'), payload('orbit_preview.mp3')]);
  await page
    .getByLabel('Purchased MP3 files')
    .setInputFiles([payload('nova_untagged.mp3'), payload('orbit_untagged.mp3')]);
  await page.getByLabel('Publish beats with complete files and licenses').check();
  await page.getByRole('button', { name: 'Start bulk upload' }).click();
  await expect(page.getByText('orbit_preview.mp3: published', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByLabel('Select nova preview', { exact: true }).check();
  await page.getByLabel('Select orbit preview', { exact: true }).check();
  await page.getByLabel('Bulk value').fill('Space, Ambient');
  await page.getByRole('button', { name: 'Apply to selected' }).click();
  await expect(page.getByRole('status')).toContainText('orbit preview: updated');
  await page.goto('/ziova');
  await expect(page.locator('.beat-row').filter({ hasText: 'nova preview' })).toContainText(
    'Space',
  );
  await expect(page.locator('.beat-row').filter({ hasText: 'orbit preview' })).toContainText(
    'Ambient',
  );
});
test('new producer pages remain usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    '/dashboard/promotions',
    '/dashboard/audience',
    '/dashboard/analytics',
    '/dashboard/collaborators',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      path,
    ).toBe(false);
    await page.screenshot({
      path: `test-results/mobile-tools-${path.split('/').pop()}.png`,
      fullPage: true,
      caret: 'initial',
    });
  }
});

test('producer can share an embedded catalog while checkout and private pages stay outside frames', async ({
  page,
}) => {
  await page.goto('/dashboard/store');
  await page.getByText('Share your store', { exact: true }).click();
  await expect(page.getByLabel('Your store link')).toHaveValue(`${base}/ziova`);
  await expect(page.getByLabel('Embed code')).toHaveValue(/\/ziova\/embed/);
  for (const path of ['/dashboard/store', '/ziova', '/login']) {
    const response = await page.request.get(path);
    expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  }
  const response = await page.request.get('/ziova/embed');
  expect(response.headers()['content-security-policy']).toBe('frame-ancestors *');
  await page.setContent(
    `<iframe title="Embedded catalog" src="${base}/ziova/embed" width="900" height="800"></iframe>`,
  );
  const frame = page.frameLocator('iframe');
  await expect(
    frame.getByRole('heading', { name: 'eyesight', exact: true, level: 3 }),
  ).toBeVisible();
  await frame.getByPlaceholder('Search by name, mood, or sound…').fill('eyesight');
  const popupPromise = page.waitForEvent('popup');
  await frame.getByRole('button', { name: '$19.99', exact: true }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  await expect(popup).toHaveURL(/\/ziova\?beat=/);
  await expect(popup.getByRole('dialog')).toBeVisible();
  await popup.close();
});

test('landing releases play and mobile navigation restores keyboard focus', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(base);
  await expect(
    page
      .locator('.release-shelf')
      .getByRole('link', { name: 'View licenses for eyesight', exact: true }),
  ).toContainText('From $19.99');
  // The shelf's articles share the same player, so switching a release stops the previous one.
  await page
    .locator('.release-shelf')
    .getByRole('button', { name: 'Play eyesight', exact: true })
    .click();
  await expect(page.locator('.persistent-player')).toBeVisible();
  await expect(
    page.locator('.release-shelf').getByRole('button', { name: 'Pause eyesight', exact: true }),
  ).toBeVisible();
  await page
    .locator('.release-shelf')
    .getByRole('button', { name: 'Play after hours', exact: true })
    .click();
  await expect(
    page.locator('.release-shelf').getByRole('button', { name: 'Play eyesight', exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.release-shelf').getByRole('button', { name: 'Pause after hours', exact: true }),
  ).toBeVisible();
  await page.goto(`${base}/dashboard`);
  const menu = page.getByRole('button', { name: 'Open navigation' });
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Producer navigation' })).toBeVisible();
  for (let i = 0; i < 20; i++) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.sidebar')))).toBe(
    true,
  );
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.goto(`${base}/dashboard/store`);
  expect(
    await page
      .getByLabel('Display name')
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await page.goto(`${base}/dashboard/beats`);
  expect(
    await page
      .locator('.library-toolbar input')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await context.close();
});

import { expect, test, type Page } from '@playwright/test';

async function shaderTime(page: Page) {
  return page.locator('.studio-field canvas').evaluate((element) => {
    const gl = (element as HTMLCanvasElement).getContext('webgl');
    if (!gl) return null;
    const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null;
    if (!program) return null;
    const location = gl.getUniformLocation(program, 'time');
    return location ? (gl.getUniform(program, location) as number) : null;
  });
}

test('background pauses, resumes and stops work offscreen while store actions stay available', async ({
  page,
}) => {
  await page.goto('/');
  await expect.poll(() => shaderTime(page)).not.toBeNull();
  const first = (await shaderTime(page))!;
  await expect.poll(() => shaderTime(page)).toBeGreaterThan(first);
  await page.getByRole('button', { name: 'Pause background' }).click();
  await expect(page.getByRole('button', { name: 'Resume background' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const frozen = await shaderTime(page);
  await page.waitForTimeout(180);
  expect(await shaderTime(page)).toBe(frozen);
  await page.getByRole('button', { name: 'Resume background' }).click();
  await expect.poll(() => shaderTime(page)).toBeGreaterThan(frozen!);
  await page.locator('.landing-footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  const offscreen = await shaderTime(page);
  await page.waitForTimeout(180);
  expect(await shaderTime(page)).toBe(offscreen);
  await page.getByRole('link', { name: 'Create your store', exact: true }).last().click();
  await expect(page).toHaveURL(/\/signup$/);
});

test('reduced motion freezes shader and shows headline without entrance movement', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your beats. Your business.' })).toBeVisible();
  await expect.poll(() => shaderTime(page)).toBe(0);
  expect(
    await page
      .locator('.title-line > span')
      .first()
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  await page.waitForTimeout(180);
  expect(await shaderTime(page)).toBe(0);
  await expect(page.getByRole('link', { name: 'Create your free store' })).toBeVisible();
});

test('graphics failure retains readable content, previews and the signup path', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your beats. Your business.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play eyesight', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Create your free store' }).click();
  await expect(page).toHaveURL(/\/signup$/);
});

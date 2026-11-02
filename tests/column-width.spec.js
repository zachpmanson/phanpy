import { test, expect } from './fixtures/local';
import {
  setupSynthetic,
  openSettings,
  closeSettings,
} from './fixtures/synthetic';

test('column width persists without columns, applies on mount, resets to 360', async ({
  page,
}) => {
  await setupSynthetic(page);
  await page.goto('/');
  await page.locator('.status').first().waitFor();
  await openSettings(page);
  const slider = page.getByLabel('Column width');
  await expect(slider).toHaveAttribute('min', '360');
  await expect(slider).toHaveAttribute('max', '600');
  await expect(slider).toHaveValue('360');
  await slider.fill('520');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('columnSize')))
    .toBe('520');
  await closeSettings(page);
  await page.reload();
  await page.locator('.status').first().waitFor();
  await page.evaluate(() => {
    window.__STATES__.shortcuts = [
      { type: 'following' },
      { type: 'public', local: true },
    ];
    window.__STATES__.settings.shortcutsColumnsMode = true;
  });
  await expect(page.locator('#columns')).toHaveCSS('--column-size', '520px');
  await openSettings(page);
  await expect(slider).toHaveValue('520');
  await slider.fill('600');
  await expect(page.locator('#columns')).toHaveCSS('--column-size', '600px');
  await slider.fill('360');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('columnSize')))
    .toBeNull();
  await expect(page.locator('#columns')).toHaveCSS('--column-size', '360px');
});

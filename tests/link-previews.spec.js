import { test, expect } from './fixtures/local';
import {
  closeSettings,
  openSettings,
  post,
  setupSynthetic,
} from './fixtures/synthetic';

test('hide link previews is account-scoped, defaults off and leaves quotes/text intact', async ({
  page,
}) => {
  await setupSynthetic(page, {
    posts: [
      post('123', {
        card: {
          url: 'https://fixture.invalid/article',
          title: 'Synthetic article card',
          type: 'link',
          description: 'Article description',
        },
      }),
      post('124', {
        quote: {
          state: 'accepted',
          quoted_status: post('125', {
            content: '<p>Synthetic inline quote</p>',
          }),
        },
      }),
    ],
    local: { 'settings-hideLinkPreviews': { '9@fixture.invalid': true } },
  });
  await page.goto('/');
  await expect(
    page.getByText('Synthetic article card', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Synthetic inline quote', { exact: true }),
  ).toBeVisible();
  await openSettings(page);
  const toggle = page.getByLabel('Hide link previews', { exact: true });
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('settings-hideLinkPreviews')),
      ),
    )
    .toEqual({ '1@fixture.invalid': true, '9@fixture.invalid': true });
  await closeSettings(page);
  await expect(
    page.getByText('Synthetic article card', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Synthetic post 123', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Synthetic inline quote', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('Synthetic post 123', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Synthetic article card', { exact: true }),
  ).toHaveCount(0);
  await openSettings(page);
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await closeSettings(page);
  await expect(
    page.getByText('Synthetic article card', { exact: true }),
  ).toBeVisible();
});

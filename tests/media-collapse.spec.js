import { test, expect } from './fixtures/local';
import {
  attachment,
  closeSettings,
  openSettings,
  post,
  setupSynthetic,
} from './fixtures/synthetic';

const hidden = { 'settings-hideMediaPreviews': { '1@fixture.invalid': true } };
const mediaPost = (id, count = 1, extra = {}) =>
  post(id, {
    media_attachments: Array.from({ length: count }, (_, i) =>
      attachment(`${id}-${i}`),
    ),
    ...extra,
  });
const article = (page, id = '123') =>
  page.locator(`article[data-state-post-id="fixture.invalid/${id}"]`);

test('hide_all collapses single/multiple media, toggles live, re-collapses and persists', async ({
  page,
}) => {
  await setupSynthetic(page, {
    posts: [mediaPost('123'), mediaPost('124', 3)],
    preferences: { 'reading:expand:media': 'hide_all' },
    local: { 'settings-hideMediaPreviews': { '9@fixture.invalid': true } },
  });
  await page.goto('/');
  await expect(article(page).locator('.media')).toHaveCount(1);
  await openSettings(page);
  const toggle = page.getByLabel('Hide media previews', { exact: true });
  await expect(toggle).not.toBeChecked();
  await toggle.check();
  await closeSettings(page);
  for (const id of ['123', '124']) {
    const status = article(page, id);
    await expect(status.locator('.media')).toHaveCount(0);
    const collapsedHeight = (await status.boundingBox()).height;
    await status
      .getByRole('button', { name: 'Show media', exact: true })
      .click();
    await expect(status.locator('.media')).toHaveCount(id === '123' ? 1 : 3);
    expect((await status.boundingBox()).height).toBeGreaterThan(
      collapsedHeight + 80,
    );
    await status.getByRole('button', { name: /Show less/ }).click();
    await expect(status.locator('.media')).toHaveCount(0);
  }
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('settings-hideMediaPreviews')),
      ),
    )
    .toEqual({ '1@fixture.invalid': true, '9@fixture.invalid': true });
  await page.reload();
  await expect(
    article(page).getByRole('button', { name: 'Show media', exact: true }),
  ).toBeVisible();
  await expect(article(page).locator('.media')).toHaveCount(0);
});

for (const [name, preference, extra, collapsed] of [
  ['ordinary default', 'default', {}, false],
  ['sensitive default', 'default', { sensitive: true }, true],
  ['sensitive show_all', 'show_all', { sensitive: true }, false],
  [
    'blur overrides show_all',
    'show_all',
    {
      filtered: [
        {
          filter: {
            id: 'filter',
            title: 'Synthetic filter',
            context: ['home'],
            filter_action: 'blur',
          },
        },
      ],
    },
    true,
  ],
]) {
  test(`collapse respects ${name} and explicit reveals`, async ({ page }) => {
    await setupSynthetic(page, {
      posts: [mediaPost('123', 1, extra)],
      preferences: { 'reading:expand:media': preference },
      local: hidden,
    });
    await page.goto('/');
    await expect(article(page)).toBeVisible();
    await expect(article(page).locator('.media')).toHaveCount(
      collapsed ? 0 : 1,
    );
    if (collapsed) {
      await article(page)
        .getByRole('button', { name: /Show media/ })
        .click();
      await expect(article(page).locator('.media')).toHaveCount(1);
      await article(page)
        .getByRole('button', { name: /Show less/ })
        .click();
      await expect(article(page).locator('.media')).toHaveCount(0);
    }
  });
}

for (const mediaFirst of [false, true]) {
  test(`content warning reveal re-collapses (${mediaFirst ? 'media-first' : 'standard'})`, async ({
    page,
  }) => {
    await setupSynthetic(page, {
      posts: [
        mediaPost('123', 2, {
          sensitive: true,
          spoiler_text: 'Synthetic warning',
        }),
      ],
      preferences: { 'reading:expand:media': 'hide_all' },
      local: hidden,
      version: mediaFirst ? '4.5.0 (compatible; Pixelfed 0.12)' : '4.5.0',
    });
    await page.goto('/');
    await expect(
      article(page).getByRole('button', { name: 'Show content', exact: true }),
    ).toBeVisible();
    await expect(article(page).locator('.media')).toHaveCount(0);
    await article(page)
      .getByRole('button', { name: 'Show content', exact: true })
      .click();
    await expect(article(page).locator('.media')).toHaveCount(2);
    await article(page)
      .getByRole('button', { name: /Show less/ })
      .click();
    await expect(article(page).locator('.media')).toHaveCount(0);
  });
}

test('media-first ordinary hide_all has a reveal control even with renderer absent', async ({
  page,
}) => {
  await setupSynthetic(page, {
    posts: [mediaPost('123', 2)],
    preferences: { 'reading:expand:media': 'hide_all' },
    local: hidden,
    version: '4.5.0 (compatible; Pixelfed 0.12)',
  });
  await page.goto('/');
  await expect(article(page)).toHaveClass(/status-media-first/);
  await expect(article(page).locator('.media-first-container')).toHaveCount(0);
  await article(page)
    .getByRole('button', { name: 'Show media', exact: true })
    .click();
  await expect(article(page).locator('.media-first-container')).toHaveCount(1);
  await expect(article(page).locator('.media')).toHaveCount(2);
  await article(page)
    .getByRole('button', { name: /Show less/ })
    .click();
  await expect(article(page).locator('.media-first-container')).toHaveCount(0);
});

test('large post retains upstream auto-reveal and supports multi-attachment re-collapse', async ({
  page,
}) => {
  await setupSynthetic(page, {
    posts: [mediaPost('123', 3)],
    preferences: { 'reading:expand:media': 'hide_all' },
    local: hidden,
  });
  const contextLoaded = page.waitForResponse('**/api/v1/statuses/123/context');
  await page.goto('/#/fixture.invalid/s/123');
  await contextLoaded;
  await expect(page.locator('.timeline.contextual')).not.toHaveClass(
    /\bloading\b/,
  );
  const status = article(page).and(page.locator('.large'));
  // Both upstream and the original fork auto-reveal the hero after one second.
  // Wait for that existing behaviour instead of racing its delayed button click.
  await expect(
    status.getByRole('button', { name: 'Show less', exact: true }),
  ).toBeVisible();
  await expect(status.locator('.media-large-container .media')).toHaveCount(3);
  await status.getByRole('button', { name: 'Show less', exact: true }).click();
  await expect(status.locator('.media-large-container')).toHaveCount(0);
  await status.getByRole('button', { name: 'Show media', exact: true }).click();
  await expect(status.locator('.media-large-container .media')).toHaveCount(3);
  await status.getByRole('button', { name: 'Show less', exact: true }).click();
  await expect(status.locator('.media-large-container')).toHaveCount(0);
});

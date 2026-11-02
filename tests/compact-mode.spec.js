import { test, expect } from './fixtures/local';
import {
  capture,
  closeSettings,
  openSettings,
  post,
  setupSynthetic,
} from './fixtures/synthetic';

for (const theme of ['light', 'dark']) {
  test(`compact layout updates mounted cards immediately and is independent of ${theme}`, async ({
    page,
  }, testInfo) => {
    await setupSynthetic(page, {
      posts: [
        post('123', {
          content: '<p>Bonjour tout le monde, voici un message français.</p>',
          language: 'fr',
        }),
      ],
      local: { theme },
    });
    await page.goto('/');
    const status = page.locator('article.status').first();
    await expect(status.locator(':scope > a .avatar')).toHaveCount(1);
    await expect(status.locator('.meta-name .avatar')).toHaveCount(0);
    await status.evaluate((el) => {
      el.dataset.mountMarker = 'same-card';
    });
    await openSettings(page);
    await expect(
      page.getByLabel('Compact mode', { exact: true }),
    ).not.toBeChecked();
    await page.getByLabel('Compact mode', { exact: true }).check();
    await closeSettings(page);
    await expect(page.locator('html')).toHaveClass(new RegExp(`is-${theme}`));
    await expect(page.locator('html')).toHaveClass(/is-compact/);
    await expect(status).toHaveAttribute('data-mount-marker', 'same-card');
    await expect(status.locator(':scope > a .avatar')).toHaveCount(0);
    const avatar = status.locator('.meta-name .avatar');
    await expect(avatar).toHaveCount(1);
    const box = await avatar.boundingBox();
    expect(box.width).toBeLessThan(25);
    expect(box.width).toBeGreaterThan(10);
    await expect(status.locator('.container')).toHaveCSS(
      'padding-inline-start',
      '0px',
    );
    await expect(status.locator('.meta-name')).toContainText(
      'Fixture Display Name',
    );
    await status.locator('.time').click();
    await expect(
      page.getByRole('menuitem', { name: 'Translate', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('menuitem', { name: 'Translate', exact: true })
      .focus();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('menuitem', { name: 'Translate', exact: true }),
    ).not.toBeVisible();
    await openSettings(page);
    await page
      .getByLabel('Show username instead of display name on timeline posts')
      .check();
    await closeSettings(page);
    await expect(status.locator('.meta-name')).not.toContainText(
      'Fixture Display Name',
    );
    await expect(status.locator('.meta-name')).toContainText('fixtureuser');
    await status.locator('.time').click();
    await expect(
      page.getByRole('menuitem', { name: 'Translate', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('menuitem', { name: 'Translate', exact: true })
      .focus();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('menuitem', { name: 'Translate', exact: true }),
    ).not.toBeVisible();
    await capture(page, testInfo, `compact-${theme}`);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/is-compact/);
    await expect(page.locator('html')).toHaveClass(new RegExp(`is-${theme}`));
    await openSettings(page);
    await page.getByLabel('Compact mode', { exact: true }).uncheck();
    await closeSettings(page);
    await expect(page.locator('html')).not.toHaveClass(/is-compact/);
    await expect(status.locator(':scope > a .avatar')).toHaveCount(1);
    expect(
      await page.evaluate(() => localStorage.getItem('compactMode')),
    ).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(
      theme,
    );
  });
}

test('old plain theme migrates once to compact plus automatic colors', async ({
  page,
}) => {
  await setupSynthetic(page, { local: { theme: 'plain' } });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/is-compact/);
  await expect(page.locator('html')).not.toHaveClass(
    /is-plain|is-light|is-dark/,
  );
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('compactMode'))).toBe(
    'true',
  );
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute(
    'content',
    'light dark',
  );
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/is-compact/);
});

test('compact multi-column preserves selected column width and avatar alignment', async ({
  page,
}, testInfo) => {
  await setupSynthetic(page, {
    local: {
      compactMode: 'true',
      columnSize: '480',
      theme: 'dark',
      shortcuts: {
        '1@fixture.invalid': [
          { type: 'following' },
          { type: 'public', local: true },
        ],
      },
      'settings-shortcutsViewMode': { '1@fixture.invalid': 'multi-column' },
    },
  });
  await page.goto('/');
  await expect(page.locator('#columns')).toHaveCSS('--column-size', '480px');
  await expect(page.locator('#columns > *')).toHaveCount(2);
  for (const column of await page.locator('#columns > *').all()) {
    await expect(column.locator('.meta-name .avatar').first()).toBeVisible();
    await expect(column.locator('article.status > a .avatar')).toHaveCount(0);
    await expect(column).toHaveCSS('padding-inline-start', '0px');
  }
  await capture(page, testInfo, 'compact-multicolumn');
});

test('compact contextual thread keeps indentation, aligned hero content and metric controls', async ({
  page,
}, testInfo) => {
  const root = post();
  const child = post('124', {
    content: '<p>Synthetic child reply</p>',
    account: { ...root.account, id: '3', username: 'child', acct: 'child' },
    in_reply_to_id: '123',
    in_reply_to_account_id: '2',
  });
  const grandchild = post('125', {
    content: '<p>Synthetic grandchild reply</p>',
    account: {
      ...root.account,
      id: '4',
      username: 'grandchild',
      acct: 'grandchild',
    },
    in_reply_to_id: '124',
    in_reply_to_account_id: '3',
  });
  await setupSynthetic(page, {
    posts: [root],
    context: { ancestors: [], descendants: [child, grandchild] },
    local: { compactMode: 'true', theme: 'light' },
  });
  await page.goto('/#/fixture.invalid/s/123');
  const hero = page.locator('article.status.large');
  await expect(hero.locator('.meta-name .avatar')).toBeVisible();
  await expect(hero.locator('.content-container')).toHaveCSS(
    'margin-inline-start',
    '0px',
  );
  await expect(hero.locator('.favourite-button small')).toHaveText('3');
  await expect(
    page.getByText('Synthetic child reply', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Synthetic grandchild reply', { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.timeline.contextual > li.descendant').first(),
  ).toHaveCSS('border-inline-start-width', '2px');
  await openSettings(page);
  await page.getByLabel('Hide post metrics', { exact: true }).check();
  await closeSettings(page);
  await expect(hero.locator('.favourite-button small')).toHaveCount(0);
  await capture(page, testInfo, 'compact-thread');
  await openSettings(page);
  await page.getByLabel('Compact mode', { exact: true }).uncheck();
  await closeSettings(page);
  await expect(hero.locator(':scope > a .avatar')).toHaveCount(1);
  await expect(hero.locator('.favourite-button small')).toHaveCount(0);
});

test('account initialization resets account toggles but not browser-local compact layout', async ({
  page,
}) => {
  await setupSynthetic(page, {
    local: {
      compactMode: 'true',
      'settings-hideLinkPreviews': { '1@fixture.invalid': true },
      'settings-hideMediaPreviews': { '1@fixture.invalid': true },
    },
  });
  await page.goto('/');
  await page.locator('.status').first().waitFor();
  await page.evaluate(async () => {
    const storeUtils = await import('/src/utils/store-utils.js');
    const { initStates } = await import('/src/utils/states.js');
    const accounts = JSON.parse(localStorage.getItem('accounts'));
    accounts.push({ ...accounts[0], info: { ...accounts[0].info, id: '9' } });
    localStorage.setItem('accounts', JSON.stringify(accounts));
    storeUtils.setCurrentAccountID('9');
    initStates();
  });
  await openSettings(page);
  await expect(page.getByLabel('Compact mode', { exact: true })).toBeChecked();
  await expect(
    page.getByLabel('Hide link previews', { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel('Hide media previews', { exact: true }),
  ).not.toBeChecked();
});

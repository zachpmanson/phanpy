export const account = {
  id: '2',
  username: 'fixtureuser',
  acct: 'fixtureuser',
  display_name: 'Fixture Display Name',
  url: 'https://fixture.invalid/@fixtureuser',
  avatar: 'https://fixture.invalid/avatar.svg',
  avatar_static: 'https://fixture.invalid/avatar.svg',
  emojis: [],
  fields: [],
};

export function post(id = '123', extra = {}) {
  return {
    id,
    created_at: '2026-01-01T12:00:00.000Z',
    account,
    content: `<p>Synthetic post ${id}</p>`,
    uri: `https://fixture.invalid/users/fixtureuser/statuses/${id}`,
    url: `https://fixture.invalid/@fixtureuser/${id}`,
    media_attachments: [],
    mentions: [],
    tags: [],
    emojis: [],
    reblogs_count: 2,
    favourites_count: 3,
    replies_count: 1,
    sensitive: false,
    spoiler_text: '',
    visibility: 'public',
    language: 'en',
    ...extra,
  };
}

export function attachment(id = 'media-1') {
  return {
    id,
    type: 'image',
    url: `https://fixture.invalid/${id}.svg`,
    preview_url: `https://fixture.invalid/${id}.svg`,
    description: `Synthetic image ${id}`,
    meta: { original: { width: 800, height: 600, aspect: 4 / 3 } },
  };
}

export async function setupSynthetic(
  page,
  { posts = [post()], preferences = {}, local = {} } = {},
) {
  const instance = {
    uri: 'fixture.invalid',
    domain: 'fixture.invalid',
    title: 'Synthetic Fixture',
    version: '4.5.0',
    configuration: {
      statuses: { max_characters: 500, max_media_attachments: 4 },
    },
  };
  await page.addInitScript(
    ({ local, instance, account }) => {
      if (!localStorage.getItem('accounts')) {
        localStorage.setItem(
          'accounts',
          JSON.stringify([
            {
              info: { ...account, id: '1' },
              instanceURL: 'fixture.invalid',
              accessToken: 'synthetic-not-a-token',
            },
          ]),
        );
        sessionStorage.setItem('currentAccount', '1');
        localStorage.setItem(
          'instances',
          JSON.stringify({ 'fixture.invalid': instance }),
        );
        for (const [key, value] of Object.entries(local)) {
          localStorage.setItem(
            key,
            typeof value === 'string' ? value : JSON.stringify(value),
          );
        }
      }
    },
    { local, instance, account },
  );
  await page.route('https://fixture.invalid/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith('.svg'))
      return route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="teal"/></svg>',
      });
    let json;
    if (/\/instance$/.test(pathname)) json = instance;
    else if (pathname.endsWith('/preferences')) json = preferences;
    else if (pathname.endsWith('/accounts/verify_credentials'))
      json = { ...account, id: '1' };
    else if (pathname.endsWith('/apps/verify_credentials'))
      json = { name: 'Synthetic' };
    else if (pathname.includes('/timelines/')) json = posts;
    else if (pathname.endsWith('/context'))
      json = { ancestors: [], descendants: [] };
    else if (pathname.includes('/statuses/'))
      json = posts.find((p) => p.id === pathname.split('/').at(-1));
    else json = [];
    return route.fulfill({ json: json ?? {} });
  });
}

export async function openSettings(page) {
  await page.evaluate(() => {
    window.__STATES__.showSettings = true;
  });
  await page.locator('#settings-container').waitFor();
}

export async function closeSettings(page) {
  await page.locator('#settings-container .sheet-close').click();
}

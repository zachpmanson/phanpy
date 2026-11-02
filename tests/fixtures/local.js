import { test as base, expect } from '@playwright/test';

// Explicit page.route mocks run before this context-level default-deny guard.
// Never let synthetic credentials, images or streaming requests reach a server.
export const test = base.extend({
  _localNetwork: [
    async ({ context, baseURL }, use, testInfo) => {
      const origin = new URL(baseURL).origin;
      const blocked = new Set();
      await context.route('**/*', (route) => {
        const url = route.request().url();
        if (new URL(url).origin === origin) return route.continue();
        blocked.add(url);
        return route.abort('blockedbyclient');
      });
      await context.routeWebSocket('**/*', (socket) => {
        const url = new URL(socket.url());
        if (url.host === new URL(origin).host) socket.connectToServer();
        else {
          blocked.add(socket.url());
          socket.close();
        }
      });
      await use();
      if (blocked.size) {
        await testInfo.attach('blocked-unmocked-network', {
          body: [...blocked].sort().join('\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
});

test.use({ serviceWorkers: 'block' });
export { expect };

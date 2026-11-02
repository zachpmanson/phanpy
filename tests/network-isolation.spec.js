import { test, expect } from './fixtures/local';

test('default-deny HTTP and WebSocket, but allow explicit synthetic mocks', async ({
  page,
}) => {
  await page.route('https://fixture.invalid/fulfilled', (route) =>
    route.fulfill({ json: { synthetic: true } }),
  );
  await page.routeWebSocket('wss://fixture.invalid/fulfilled', (socket) => {
    socket.onMessage(() => socket.send('synthetic'));
  });
  await page.goto('/');
  expect(
    await page.evaluate(async () => {
      try {
        await fetch('https://unmatched.invalid/denied');
        return false;
      } catch {
        return true;
      }
    }),
  ).toBe(true);
  expect(
    await page.evaluate(async () =>
      (await fetch('https://fixture.invalid/fulfilled')).json(),
    ),
  ).toEqual({ synthetic: true });
  expect(
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const socket = new WebSocket('wss://unmatched.invalid/denied');
          socket.onclose = () => resolve('closed');
          socket.onopen = () => resolve('unexpected open');
        }),
    ),
  ).toBe('closed');
  expect(
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const socket = new WebSocket('wss://fixture.invalid/fulfilled');
          socket.onopen = () => socket.send('hello');
          socket.onmessage = (event) => {
            resolve(event.data);
            socket.close();
          };
        }),
    ),
  ).toBe('synthetic');
});

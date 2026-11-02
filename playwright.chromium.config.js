// Additional local coverage only; does not replace the upstream WebKit gate.
import { defineConfig, devices } from '@playwright/test';

import local from './playwright.local.config';

export default defineConfig({
  ...local,
  use: {
    ...local.use,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  projects: [
    { name: 'Local Chromium Desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'Local Chromium Mobile', use: { ...devices['Pixel 7'] } },
  ],
});

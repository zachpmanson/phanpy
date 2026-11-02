// Same upstream Mobile Safari gate, on a dedicated port with no server reuse.
import { defineConfig } from '@playwright/test';

import upstream from './playwright.config';

export default defineConfig({
  ...upstream,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:5189' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5189 --strictPort',
    url: 'http://127.0.0.1:5189',
    reuseExistingServer: false,
  },
});

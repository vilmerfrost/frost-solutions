import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Frost Solutions E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    /* Note: Tests should use /app prefix for app routes (Next.js basePath) */
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Maximum time each action can take */
    actionTimeout: 10000,
    
    /* Maximum time for navigation */
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev -- -p 3001', // Uses webpack instead of Turbopack (--webpack flag in dev script)
    url: 'http://localhost:3001/app', // Health check URL - use /app since basePath is /app
    reuseExistingServer: !process.env.CI, // Reuse existing server in non-CI (start manually)
    timeout: 180000, // 3 minutes to start (increased for slower machines)
    stdout: 'pipe', // Show server output for debugging
    stderr: 'pipe',
  },
  
  /* Global timeout for each test */
  timeout: 60000,
  
  /* Expect timeout */
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
});

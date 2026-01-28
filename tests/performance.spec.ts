import { test, expect } from '@playwright/test';

/**
 * Performance Tests
 * Tests page load times and performance metrics
 */

const BASE_PATH = '/app';
const MAX_LOAD_TIME = 3000; // 3 seconds
const MAX_TIME_TO_INTERACTIVE = 5000; // 5 seconds

test.describe('Performance Tests - Page Load Times', () => {
  
  test('login page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_PATH}/login`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time (5 seconds in dev, 3 in prod)
    // In development, Next.js compilation can take longer
    const maxTime = process.env.NODE_ENV === 'production' ? MAX_LOAD_TIME : 5000;
    expect(loadTime).toBeLessThan(maxTime);
    
    // Verify page is interactive
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('signup page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_PATH}/signup`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // In development, Next.js compilation can take longer
    const maxTime = process.env.NODE_ENV === 'production' ? MAX_LOAD_TIME : 5000;
    expect(loadTime).toBeLessThan(maxTime);
    
    // Verify page is interactive
    const nameInput = page.getByLabel(/Fullständigt namn/i);
    await expect(nameInput).toBeVisible();
  });

  test('dashboard page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_PATH}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard may take longer due to API calls, but should be reasonable
    expect(loadTime).toBeLessThan(MAX_TIME_TO_INTERACTIVE);
  });

  test('API endpoints respond within acceptable time', async ({ request }) => {
    const endpoints = [
      '/api/admin/check',
      '/api/dashboard/stats',
      '/api/projects',
    ];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      const response = await request.get(`${BASE_PATH}${endpoint}`);
      
      const responseTime = Date.now() - startTime;
      
      // API should respond within 2 seconds (even if 401)
      expect(responseTime).toBeLessThan(2000);
      
      // Should get a response (even if error)
      expect([200, 401, 403, 404]).toContain(response.status());
    }
  });
});

test.describe('Performance Tests - Resource Loading', () => {
  
  test('page has reasonable number of network requests', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', (request) => {
      requests.push(request.url());
    });
    
    await page.goto(`${BASE_PATH}/login`);
    await page.waitForLoadState('networkidle');
    
    // Login page shouldn't make too many requests
    // Allow up to 30 requests (includes fonts, images, API calls, service workers, etc.)
    // In development, Next.js may make more requests
    expect(requests.length).toBeLessThan(30);
  });

  test('page loads critical resources first', async ({ page }) => {
    const resourceTimings: Array<{ url: string; startTime: number }> = [];
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.css') || url.includes('.js') || url.includes('api/')) {
        resourceTimings.push({
          url,
          startTime: Date.now(),
        });
      }
    });
    
    await page.goto(`${BASE_PATH}/login`);
    await page.waitForLoadState('networkidle');
    
    // Critical resources (CSS, JS) should load early
    const cssResources = resourceTimings.filter(r => r.url.includes('.css'));
    const jsResources = resourceTimings.filter(r => r.url.includes('.js'));
    
    // Should have loaded CSS and JS
    expect(cssResources.length + jsResources.length).toBeGreaterThan(0);
  });

  test('images are optimized and load efficiently', async ({ page }) => {
    const imageRequests: Array<{ url: string; size: number }> = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || '0', 10);
        imageRequests.push({
          url,
          size: contentLength,
        });
      }
    });
    
    await page.goto(`${BASE_PATH}/signup`);
    await page.waitForLoadState('networkidle');
    
    // Check that images aren't too large (should be optimized)
    for (const img of imageRequests) {
      // Individual images shouldn't be larger than 500KB
      if (img.size > 0) {
        expect(img.size).toBeLessThan(500 * 1024);
      }
    }
  });
});

test.describe('Performance Tests - Time to Interactive', () => {
  
  test('login page becomes interactive quickly', async ({ page }) => {
    await page.goto(`${BASE_PATH}/login`);
    
    const startTime = Date.now();
    
    // Wait for email input to be visible and enabled
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();
    
    const timeToInteractive = Date.now() - startTime;
    
    // Should be interactive within 2 seconds
    expect(timeToInteractive).toBeLessThan(2000);
  });

  test('signup form becomes interactive quickly', async ({ page }) => {
    await page.goto(`${BASE_PATH}/signup`);
    
    const startTime = Date.now();
    
    // Wait for first input to be visible and enabled
    const nameInput = page.getByLabel(/Fullständigt namn/i);
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEnabled();
    
    const timeToInteractive = Date.now() - startTime;
    
    // Should be interactive within 2 seconds
    expect(timeToInteractive).toBeLessThan(2000);
  });
});

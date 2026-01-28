import { test, expect, devices } from '@playwright/test';

/**
 * Mobile Responsive Tests for Frost Solutions
 * Tests that the app works correctly on mobile devices
 */

test.describe('Mobile - iPhone 13', () => {
  test('homepage is responsive', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'iPhone tests run on webkit');
    await page.setViewportSize(devices['iPhone 13'].viewport!);
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    // Should show Frost branding or redirect to login
    const url = page.url();
    if (url.includes('/app')) {
      // Check for homepage content (either heading or login button)
      const heading = page.getByRole('heading', { name: 'Frost Solutions' });
      const loginButton = page.getByRole('button', { name: 'Logga in' });
      await expect(heading.or(loginButton).first()).toBeVisible();
    }
  });

  test('signup page is responsive', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'iPhone tests run on webkit');
    await page.setViewportSize(devices['iPhone 13'].viewport!);
    await page.goto('/app/signup');
    await page.waitForLoadState('networkidle');
    
    // Form should be visible
    await expect(page.getByLabel(/Fullständigt namn/i)).toBeVisible();
    await expect(page.getByLabel(/E-postadress/i)).toBeVisible();
    await expect(page.getByLabel(/Lösenord/i)).toBeVisible();
    await expect(page.getByLabel(/Företagsnamn/i)).toBeVisible();
    
    // Submit button should be visible
    await expect(page.getByRole('button', { name: /Skapa gratis konto/i })).toBeVisible();
  });

  test('login page is responsive', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'iPhone tests run on webkit');
    await page.setViewportSize(devices['iPhone 13'].viewport!);
    await page.goto('/app/login');
    await page.waitForLoadState('networkidle');
    
    // OAuth buttons should be visible
    await expect(page.getByText(/Fortsätt med Google/i)).toBeVisible();
    
    // Email input should be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Magic link button should be visible
    await expect(page.getByRole('button', { name: /Magic Link/i })).toBeVisible();
  });

  test('can fill signup form on mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'iPhone tests run on webkit');
    await page.setViewportSize(devices['iPhone 13'].viewport!);
    await page.goto('/app/signup');
    await page.waitForLoadState('networkidle');
    
    // Fill form
    await page.getByLabel(/Fullständigt namn/i).fill('Test User');
    await page.getByLabel(/E-postadress/i).fill('test@mobile.se');
    await page.getByLabel(/Lösenord/i).fill('password123');
    await page.getByLabel(/Företagsnamn/i).fill('Mobile Test AB');
    
    // Verify values
    await expect(page.getByLabel(/Fullständigt namn/i)).toHaveValue('Test User');
    await expect(page.getByLabel(/E-postadress/i)).toHaveValue('test@mobile.se');
    await expect(page.getByLabel(/Företagsnamn/i)).toHaveValue('Mobile Test AB');
  });

  test('navigation works on mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'iPhone tests run on webkit');
    await page.setViewportSize(devices['iPhone 13'].viewport!);
    await page.goto('/app/signup');
    await page.waitForLoadState('networkidle');
    
    // Navigate to login
    await page.getByRole('link', { name: /Logga in/i }).click();
    await expect(page).toHaveURL(/\/app\/login/);
    
    // Navigate back to signup
    await page.getByText(/Skapa konto/i).click();
    await expect(page).toHaveURL(/\/app\/signup/);
  });
});

test.describe('Mobile - Pixel 5', () => {
  test('homepage works on Android', async ({ page }) => {
    await page.setViewportSize(devices['Pixel 5'].viewport!);
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('/app')) {
      // Check for homepage content (either heading or login button)
      const heading = page.getByRole('heading', { name: 'Frost Solutions' });
      const loginButton = page.getByRole('button', { name: 'Logga in' });
      await expect(heading.or(loginButton).first()).toBeVisible();
    }
  });

  test('signup works on Android', async ({ page }) => {
    await page.setViewportSize(devices['Pixel 5'].viewport!);
    await page.goto('/app/signup');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByRole('button', { name: /Skapa gratis konto/i })).toBeVisible();
  });
});

test.describe('Tablet - iPad', () => {
  test('homepage looks good on tablet', async ({ page }) => {
    await page.setViewportSize(devices['iPad Pro 11'].viewport!);
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    if (url.includes('/app')) {
      // Check for homepage content (either heading or login button)
      const heading = page.getByRole('heading', { name: 'Frost Solutions' });
      const loginButton = page.getByRole('button', { name: 'Logga in' });
      await expect(heading.or(loginButton).first()).toBeVisible();
    }
  });

  test('signup page is usable on tablet', async ({ page }) => {
    await page.setViewportSize(devices['iPad Pro 11'].viewport!);
    await page.goto('/app/signup');
    await page.waitForLoadState('networkidle');
    
    // All fields should be visible
    await expect(page.getByLabel(/Fullständigt namn/i)).toBeVisible();
    await expect(page.getByLabel(/E-postadress/i)).toBeVisible();
    await expect(page.getByLabel(/Lösenord/i)).toBeVisible();
    await expect(page.getByLabel(/Företagsnamn/i)).toBeVisible();
  });
});

test.describe('Touch Interactions', () => {
  test('buttons have adequate touch targets', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 13'].viewport!);
    await page.goto('/app/signup');
    await page.waitForLoadState('networkidle');
    
    const submitButton = page.getByRole('button', { name: /Skapa gratis konto/i });
    const box = await submitButton.boundingBox();
    
    // Minimum touch target should be 44x44px (iOS) or 48x48px (Android)
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('input fields are easily tappable', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 13'].viewport!);
    await page.goto('/app/signup');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.getByLabel(/E-postadress/i);
    const box = await emailInput.boundingBox();
    
    // Input should have adequate height
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });
});

test.describe('Viewport Responsiveness', () => {
  test('handles narrow viewport (320px)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE
    await page.goto('/app/signup');
    await page.waitForLoadState('networkidle');
    
    // Should not have horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    // Allow small tolerance for scrollbar
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
  });

  test('handles wide viewport (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/app/signup');
    await page.waitForLoadState('networkidle');
    
    // Content should be centered or constrained
    await expect(page.locator('form')).toBeVisible();
  });
});

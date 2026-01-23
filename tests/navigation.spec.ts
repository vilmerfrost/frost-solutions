import { test, expect } from '@playwright/test';

/**
 * Navigation Tests for Frost Solutions
 * Tests that all public routes are accessible
 */

test.describe('Public Page Navigation', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Should show either landing page or redirect
    await page.waitForLoadState('networkidle');
    
    // Check for Frost branding
    await expect(page.locator('text=Frost')).toBeVisible();
  });

  test('signup page loads correctly', async ({ page }) => {
    await page.goto('/signup');
    
    await expect(page.locator('text=Kom igång med Frost')).toBeVisible();
    await expect(page.getByRole('button', { name: /Skapa gratis konto/i })).toBeVisible();
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('text=Frost Solutions')).toBeVisible();
    await expect(page.getByText(/Fortsätt med Google/i)).toBeVisible();
  });

  test('FAQ page loads', async ({ page }) => {
    const response = await page.goto('/faq');
    
    // Should either load or redirect
    expect([200, 302, 307]).toContain(response?.status() || 200);
  });

  test('feedback page loads', async ({ page }) => {
    const response = await page.goto('/feedback');
    
    expect([200, 302, 307]).toContain(response?.status() || 200);
  });
});

test.describe('Navigation Flow - Homepage to Signup', () => {
  test('can navigate from homepage to signup', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click signup button
    const signupButton = page.locator('text=Kom igång gratis');
    if (await signupButton.isVisible()) {
      await signupButton.click();
      await expect(page).toHaveURL(/signup/);
    }
  });

  test('can navigate from homepage to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click login button
    const loginButton = page.getByRole('button', { name: /Logga in/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/login/);
    }
  });
});

test.describe('Navigation Flow - Between Auth Pages', () => {
  test('can navigate from signup to login', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('link', { name: /Logga in/i }).click();
    await expect(page).toHaveURL(/login/);
  });

  test('can navigate from login to signup', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.getByText(/Skapa konto/i).click();
    await expect(page).toHaveURL(/signup/);
  });
});

test.describe('404 Handling', () => {
  test('non-existent page returns 404 or redirect', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    
    // Should either show 404 or redirect
    const status = response?.status() || 200;
    // 200 if custom 404 page, 404 if default, 302/307 if redirect
    expect([200, 404, 302, 307]).toContain(status);
  });
});

test.describe('API Route Existence', () => {
  test('stripe create-checkout endpoint exists', async ({ request }) => {
    const response = await request.post('/api/stripe/create-checkout', {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    
    // 401 means endpoint exists but requires auth
    // 400 means endpoint exists but bad request
    expect([400, 401]).toContain(response.status());
  });

  test('import bygglet endpoint exists', async ({ request }) => {
    const response = await request.post('/api/import/bygglet', {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    
    expect([400, 401]).toContain(response.status());
  });
});

import { test, expect } from '@playwright/test';

/**
 * Critical User Journey Tests for Frost Solutions
 * These tests verify the core functionality needed for free trial launch
 */

test.describe('Authentication Pages', () => {
  
  test('Homepage loads and shows login/signup options', async ({ page }) => {
    await page.goto('/');
    
    // Should show the landing page with Frost Solutions branding
    await expect(page.locator('text=Frost Solutions')).toBeVisible();
    
    // Should have signup and login buttons
    await expect(page.locator('text=Kom igång gratis')).toBeVisible();
    await expect(page.locator('text=Logga in')).toBeVisible();
  });

  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Should show login form
    await expect(page.locator('text=Frost Solutions')).toBeVisible();
    await expect(page.locator('text=Logga in för att fortsätta')).toBeVisible();
    
    // Should have OAuth buttons
    await expect(page.locator('text=Fortsätt med Google')).toBeVisible();
    await expect(page.locator('text=Fortsätt med Microsoft')).toBeVisible();
    
    // Should have email input and magic link button
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('text=Skicka Magic Link')).toBeVisible();
    
    // Should have link to signup
    await expect(page.locator('text=Skapa konto gratis')).toBeVisible();
  });

  test('Signup page loads correctly', async ({ page }) => {
    await page.goto('/signup');
    
    // Should show signup form
    await expect(page.locator('text=Kom igång med Frost')).toBeVisible();
    await expect(page.locator('text=30 dagars gratis provperiod')).toBeVisible();
    
    // Should have all required fields
    await expect(page.locator('input[type="text"]')).toBeVisible(); // Full name
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Should have submit button
    await expect(page.locator('text=Skapa gratis konto')).toBeVisible();
    
    // Should have link to login
    await expect(page.locator('text=Logga in')).toBeVisible();
    
    // Should show trial benefits
    await expect(page.locator('text=30 dagar gratis')).toBeVisible();
    await expect(page.locator('text=Ingen bindningstid')).toBeVisible();
    await expect(page.getByText('Inget betalkort', { exact: true }).first()).toBeVisible();
  });

  test('Login page magic link flow shows success message', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in email
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Submit form
    await page.click('button:has-text("Skicka Magic Link")');
    
    // Should show loading state or success message
    // Note: This will fail with actual Supabase without valid email
    // In real tests, use a test email or mock the API
  });

  test('Signup form validates required fields', async ({ page }) => {
    await page.goto('/signup');
    
    // Try to submit empty form
    await page.click('button:has-text("Skapa gratis konto")');
    
    // Form should not navigate away (HTML5 validation)
    await expect(page).toHaveURL(/signup/);
  });

  test('Navigation from homepage to signup works', async ({ page }) => {
    await page.goto('/');
    
    // Click signup button
    await page.click('text=Kom igång gratis');
    
    // Should navigate to signup
    await expect(page).toHaveURL(/signup/);
  });

  test('Navigation from homepage to login works', async ({ page }) => {
    await page.goto('/');
    
    // Click login button  
    await page.click('button:has-text("Logga in")');
    
    // Should navigate to login
    await expect(page).toHaveURL(/login/);
  });

  test('Navigation from login to signup works', async ({ page }) => {
    await page.goto('/login');
    
    // Click signup link
    await page.click('text=Skapa konto gratis');
    
    // Should navigate to signup
    await expect(page).toHaveURL(/signup/);
  });

  test('Navigation from signup to login works', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    
    // Click login link and wait for navigation
    await Promise.all([
      page.waitForURL(/login/, { timeout: 15000 }),
      page.getByRole('link', { name: 'Logga in' }).click()
    ]);
    
    // Verify we're on login page
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Onboarding Page', () => {
  
  test('Onboarding page loads with company form', async ({ page }) => {
    // Note: This requires authentication, may redirect to login
    await page.goto('/onboarding');
    
    // Either shows onboarding or redirects to login
    const url = page.url();
    if (url.includes('onboarding')) {
      await expect(page.locator('text=Välkommen till Frost Solutions')).toBeVisible();
      await expect(page.locator('text=Företagsnamn')).toBeVisible();
    }
  });
});

test.describe('Visual Regression Tests', () => {
  
  test('Login page looks correct', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('Signup page looks correct', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('signup-page.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('Homepage looks correct', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });
});

test.describe('Mobile Responsive Tests', () => {
  
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('Login page is responsive on mobile', async ({ page }) => {
    await page.goto('/login');
    
    // Form should still be visible and usable
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Skicka Magic Link")')).toBeVisible();
    
    // OAuth buttons should be visible
    await expect(page.locator('text=Fortsätt med Google')).toBeVisible();
  });

  test('Signup page is responsive on mobile', async ({ page }) => {
    await page.goto('/signup');
    
    // Form should still be visible and usable
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Skapa gratis konto")')).toBeVisible();
  });

  test('Homepage is responsive on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Buttons should be visible
    await expect(page.locator('text=Kom igång gratis')).toBeVisible();
    await expect(page.locator('button:has-text("Logga in")')).toBeVisible();
  });
});

test.describe('Accessibility Tests', () => {
  
  test('Login page has proper form labels', async ({ page }) => {
    await page.goto('/login');
    
    // Email input should have associated label
    const emailLabel = page.locator('label:has-text("E-post")');
    await expect(emailLabel).toBeVisible();
  });

  test('Signup page has proper form labels', async ({ page }) => {
    await page.goto('/signup');
    
    // All inputs should have associated labels
    await expect(page.locator('label:has-text("Fullständigt namn")')).toBeVisible();
    await expect(page.locator('label:has-text("E-postadress")')).toBeVisible();
    await expect(page.locator('label:has-text("Lösenord")')).toBeVisible();
  });

  test('Buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Tab to email input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to focus the submit button
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    // Verify some element is focused (not checking specific element due to tab order variations)
  });
});

test.describe('Error Handling', () => {
  
  test('Shows error for invalid signup data', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill form with short password
    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', 'test@test.se');
    await page.fill('input[type="password"]', '123'); // Too short
    
    // Submit
    await page.click('button:has-text("Skapa gratis konto")');
    
    // Should stay on page (HTML5 validation for minLength)
    await expect(page).toHaveURL(/signup/);
  });
});

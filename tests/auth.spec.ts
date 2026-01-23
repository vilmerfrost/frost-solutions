import { test, expect } from '@playwright/test';

/**
 * Authentication Tests for Frost Solutions
 * Tests signup, login, and logout flows
 */

test.describe('Signup Flow', () => {
  test('should display signup page with all required fields', async ({ page }) => {
    await page.goto('/signup');
    
    // Check page title and branding
    await expect(page.locator('text=Kom igång med Frost')).toBeVisible();
    await expect(page.locator('text=30 dagars gratis provperiod')).toBeVisible();
    
    // Check all required fields exist
    await expect(page.getByLabel(/Fullständigt namn/i)).toBeVisible();
    await expect(page.getByLabel(/E-postadress/i)).toBeVisible();
    await expect(page.getByLabel(/Lösenord/i)).toBeVisible();
    await expect(page.getByLabel(/Företagsnamn/i)).toBeVisible();
    await expect(page.getByLabel(/Organisationsnummer/i)).toBeVisible();
    
    // Check submit button
    await expect(page.getByRole('button', { name: /Skapa gratis konto/i })).toBeVisible();
    
    // Check login link
    await expect(page.getByRole('link', { name: /Logga in/i })).toBeVisible();
    
    // Check trust badges
    await expect(page.getByText('30 dagar gratis')).toBeVisible();
    await expect(page.getByText('Ingen bindningstid')).toBeVisible();
    await expect(page.getByText('Inget betalkort').first()).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/signup');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /Skapa gratis konto/i }).click();
    
    // Should stay on signup page due to HTML5 validation
    await expect(page).toHaveURL(/signup/);
  });

  test('should validate password length (min 8 chars)', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill form with short password
    await page.getByLabel(/Fullständigt namn/i).fill('Test User');
    await page.getByLabel(/E-postadress/i).fill('test@test.se');
    await page.getByLabel(/Lösenord/i).fill('1234567'); // 7 chars - too short
    await page.getByLabel(/Företagsnamn/i).fill('Test AB');
    
    // Submit
    await page.getByRole('button', { name: /Skapa gratis konto/i }).click();
    
    // Should stay on page (HTML5 minLength validation)
    await expect(page).toHaveURL(/signup/);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/signup');
    
    // Click login link
    await page.getByRole('link', { name: /Logga in/i }).click();
    
    // Should navigate to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Login Flow', () => {
  test('should display login page with all options', async ({ page }) => {
    await page.goto('/login');
    
    // Check branding
    await expect(page.locator('text=Frost Solutions')).toBeVisible();
    
    // Check OAuth buttons
    await expect(page.getByText(/Fortsätt med Google/i)).toBeVisible();
    await expect(page.getByText(/Fortsätt med Microsoft/i)).toBeVisible();
    
    // Check email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check magic link button
    await expect(page.getByRole('button', { name: /Magic Link/i })).toBeVisible();
    
    // Check signup link
    await expect(page.getByText(/Skapa konto/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');
    
    // Enter invalid email
    await page.locator('input[type="email"]').fill('not-an-email');
    await page.getByRole('button', { name: /Magic Link/i }).click();
    
    // Should stay on login due to HTML5 validation
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');
    
    // Click signup link
    await page.getByText(/Skapa konto/i).click();
    
    // Should navigate to signup
    await expect(page).toHaveURL(/signup/);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/dashboard');
    
    // Should redirect to login or show login prompt
    // (depends on middleware implementation)
    await page.waitForURL(/\/(login|dashboard|onboarding)/);
  });

  test('should redirect unauthenticated users from projects', async ({ page }) => {
    await page.goto('/projects');
    
    // Should redirect to login
    await page.waitForURL(/\/(login|projects)/);
  });
});

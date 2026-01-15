import { test, expect } from '@playwright/test';

/**
 * User Creation
 */

test.describe('User Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to base URL
    await page.goto('http://localhost:3000');
  });

  test('Successful User Registration', async ({ page }) => {
    await page.goto('/registration');
    await page.fill('input[name="username"], input[id="username"]', 'testuser');
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'SecurePass123!');
    await page.click('button[type="submit"], button:has-text("Register")');
    await expect(page.locator('.success, .alert-success')).toBeVisible();
    await expect(page.locator('.success, .alert-success')).toContainText('success');
    await expect(page).toHaveURL(/.*dashboard/);
    // Verify in database (requires API/DB verification)
  });

  test('Registration with Invalid Data', async ({ page }) => {
    await page.goto('/registration');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error, .alert-error, .invalid-feedback')).toBeVisible();
    await expect(page).not.toHaveURL(/.*success/);
  });
});

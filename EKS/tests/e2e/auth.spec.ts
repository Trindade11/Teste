import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('admin can login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[name="email"]', 'admin@cocreateai.com.br');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page).toHaveURL(/login/);
  });
});

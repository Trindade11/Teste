import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'admin@cocreateai.com.br');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('can send message and receive response', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="message"]');
    await chatInput.fill('Hello, what is the status of startup ABC?');
    await page.click('button[aria-label="Send message"]');
    
    // Wait for response
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 10000 });
    
    // Check response exists
    const response = await page.locator('.message.assistant').first().textContent();
    expect(response).toBeTruthy();
  });

  test('chat panel can be collapsed', async ({ page }) => {
    const chatPanel = page.locator('[data-testid="chat-panel"]');
    await expect(chatPanel).toBeVisible();
    
    await page.click('[aria-label="Close chat"]');
    await expect(chatPanel).not.toBeVisible();
  });
});

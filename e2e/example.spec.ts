import { test, expect } from '@playwright/test';

test('home loads and shows header', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=TKX FRANCA v.4.0')).toBeVisible();
});

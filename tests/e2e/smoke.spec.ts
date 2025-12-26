import { expect, test } from '@playwright/test';

test('playwright runs', async ({ page }) => {
  await page.setContent('<main>Training Wallet Mobile</main>');
  await expect(page.locator('main')).toHaveText('Training Wallet Mobile');
});


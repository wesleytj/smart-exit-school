import { test, expect } from '@playwright/test';

test('produção: página carrega', async ({ page }) => {
  const targetUrl = process.env.E2E_BASE_URL || 'https://smart-exit-school.vercel.app';
  const response = await page.goto(targetUrl);
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Smart Exit School|smart-exit-school/i);
});

test('produção: health check', async ({ request }) => {
  const targetUrl = process.env.E2E_BASE_URL || 'https://smart-exit-school.vercel.app';
  const response = await request.get(`${targetUrl}/health`);
  expect(response.status()).toBe(200);
});

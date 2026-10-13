import { Page } from '@playwright/test';

export async function authenticateUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/painel|\/admin\/institutions|\/dashboard|\/escolas|\/schools/);
}

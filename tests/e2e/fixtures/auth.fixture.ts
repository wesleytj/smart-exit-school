import { test as base } from '@playwright/test';

export const test = base.extend<{ authenticatedPage: import('@playwright/test').Page }>({
  authenticatedPage: async ({ page }, use) => {
    const email = process.env.E2E_ALPHA_EMAIL || 'alpha-user@smart-exit.local';
    const password = process.env.E2E_ALPHA_PASSWORD || 'SenhaForte123!';

    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/painel|\/admin\/institutions|\/dashboard|\/escolas|\/schools/);

    await use(page);
  },
});

export { expect } from '@playwright/test';

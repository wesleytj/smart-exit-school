import { test as base, expect } from '@playwright/test';
import { authenticateUser } from './helpers/auth.helper';

const test = base.extend<{
  alphaPage: import('@playwright/test').Page;
  betaPage: import('@playwright/test').Page;
}>({
  alphaPage: async ({ browser }, use) => {
    const context = await browser.newContext({ recordVideo: { dir: 'test-results/' } });
    const page = await context.newPage();
    const email = process.env.E2E_ALPHA_EMAIL || 'alpha-user@smart-exit.local';
    const password = process.env.E2E_ALPHA_PASSWORD || 'SenhaForte123!';
    await authenticateUser(page, email, password);
    await use(page);
    await context.close();
  },
  betaPage: async ({ browser }, use) => {
    const context = await browser.newContext({ recordVideo: { dir: 'test-results/' } });
    const page = await context.newPage();
    const email = process.env.E2E_BETA_EMAIL || 'beta-user@smart-exit.local';
    const password = process.env.E2E_BETA_PASSWORD || 'SenhaForte123!';
    await authenticateUser(page, email, password);
    await use(page);
    await context.close();
  },
});

test('E2E-06: usuário Alpha não vê dados de Beta', async ({ alphaPage, betaPage }) => {
  // Alpha está logado na escola Alpha
  await expect(alphaPage).toHaveURL(/\/painel/);
  const alphaText = await alphaPage.locator('body').textContent();

  // Beta está logado na escola Beta
  await expect(betaPage).toHaveURL(/\/painel/);
  const betaText = await betaPage.locator('body').textContent();

  expect(alphaText).toContain('Tenant Alpha School');
  expect(alphaText).not.toContain('Tenant Beta School');

  expect(betaText).toContain('Tenant Beta School');
  expect(betaText).not.toContain('Tenant Alpha School');
});

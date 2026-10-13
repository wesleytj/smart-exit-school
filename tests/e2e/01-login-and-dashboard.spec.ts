import { test, expect } from './fixtures/auth.fixture';

test('E2E-01: login real e acesso ao dashboard', async ({ authenticatedPage: page }) => {
  await expect(page).toHaveURL(/\/painel|\/dashboard|\/escolas|\/schools/);
  await expect(page.locator('body')).toContainText(/Smart Exit|Monitor de Saída|Tenant Alpha School/i);
});

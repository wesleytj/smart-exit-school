import { test, expect } from './fixtures/auth.fixture';

test('E2E-07: consultar histórico/arquivo de chamadas', async ({ authenticatedPage: page }) => {
  await page.click('button:has-text("Relatórios Avançados")');
  await expect(page.locator('h1')).toContainText(/Relatórios Avançados/i);
  await expect(page.locator('body')).toContainText(/Relatórios|histórico completo de chamadas|dados da sua instituição/i);
});

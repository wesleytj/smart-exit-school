import { test, expect } from './fixtures/auth.fixture';

test('E2E-03: criar chamada de retirada e concluir', async ({ authenticatedPage: page }) => {
  await page.click('button:has-text("Monitor de Saída")');
  await expect(page.locator('h1')).toContainText(/Monitor de Saída/i);

  // Se não houver chamada ativa na fila, chama o primeiro aluno disponível
  const existingConfirmButton = page.locator('button:has-text("Confirmar Saída")').first();
  const hasActiveCall = await existingConfirmButton.isVisible().catch(() => false);

  if (!hasActiveCall) {
    const callSelect = page.locator('select:has-text("Selecione")').first();
    if (await callSelect.isVisible()) {
      await callSelect.selectOption({ index: 1 });
    }
    const callButton = page.locator('button:has-text("Chamar")').first();
    if (await callButton.isVisible()) {
      await callButton.click();
    }
  }

  // Confirma a saída do aluno da fila
  const completeButton = page.locator('button:has-text("Confirmar Saída")').first();
  await expect(completeButton).toBeVisible();
  await completeButton.click();

  await expect(page.locator('body')).toContainText(/Monitor de Saída/i);
});

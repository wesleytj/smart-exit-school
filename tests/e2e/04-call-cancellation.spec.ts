import { test, expect } from './fixtures/auth.fixture';

test('E2E-04: cancelar chamada ativa com confirmação binária', async ({ authenticatedPage: page }) => {
  await page.click('button:has-text("Monitor de Saída")');
  await expect(page.locator('h1')).toContainText(/Monitor de Saída/i);

  // Seleciona portão e chama um aluno
  const callSelect = page.locator('select:has-text("Selecione")').first();
  if (await callSelect.isVisible()) {
    await callSelect.selectOption({ index: 1 });
  }

  const callButton = page.locator('button:has-text("Chamar")').first();
  await expect(callButton).toBeVisible();
  await callButton.click();

  // Localiza a chamada na fila e aciona o cancelamento
  const cancelButton = page.locator('button:has-text("Cancelar")').first();
  await expect(cancelButton).toBeVisible();
  await cancelButton.click();

  // Modal binário de confirmação de cancelamento
  const confirmButton = page.locator('button:has-text("Cancelar chamada")');
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();

  // Verifica feedback de sucesso ou alteração do estado na fila
  await expect(page.locator('body')).toContainText(/cancelada com sucesso|Fila de Chamada/i);
});

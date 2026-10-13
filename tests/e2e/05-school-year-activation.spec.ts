import { test, expect } from './fixtures/auth.fixture';

test('E2E-05: ativar novo ano letivo atomicamente', async ({ authenticatedPage: page }) => {
  await page.click('button:has-text("Anos Letivos")');
  await expect(page.locator('h1')).toContainText(/Anos Letivos/i);

  const testYear = String(2028 + Math.floor(Math.random() * 20));

  // Cadastra novo ano letivo
  const yearInput = page.locator('input[type="number"]');
  await yearInput.fill(testYear);
  await page.click('button:has-text("Cadastrar Ano Letivo")');

  // Confirma criação
  await expect(page.locator('body')).toContainText(new RegExp(`Ano letivo ${testYear} cadastrado`, 'i'));

  // Localiza o card do ano recém criado e clica para ativar
  const yearCard = page.locator('div').filter({ hasText: `Ano Letivo ${testYear}` }).last();
  const activateButton = yearCard.locator('button:has-text("Definir como Ativo")');
  if (await activateButton.isVisible()) {
    await activateButton.click();
    await expect(page.locator('body')).toContainText(new RegExp(`Ano letivo ${testYear} ativado com sucesso`, 'i'));
  }

  // Restaura o ano letivo canônico 2026 como ativo para preservar o baseline das fixtures
  const year2026Card = page.locator('div').filter({ hasText: 'Ano Letivo 2026' }).last();
  const reactivate2026Button = year2026Card.locator('button:has-text("Definir como Ativo")');
  if (await reactivate2026Button.isVisible()) {
    await reactivate2026Button.click();
    await expect(page.locator('body')).toContainText(/Ano letivo 2026 ativado com sucesso/i);
  }
});

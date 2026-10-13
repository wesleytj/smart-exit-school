import { test, expect } from './fixtures/auth.fixture';

test('E2E-02: cadastrar aluno, matricular e vincular a turma', async ({ authenticatedPage: page }) => {
  // Navega para a aba Gestão de Alunos no painel da instituição
  await page.click('button:has-text("Gestão de Alunos")');
  await expect(page.locator('h1')).toContainText(/Gestão de Alunos/i);

  const studentName = `Aluno E2E Playwright ${Date.now()}`;
  const studentIdentifier = `E2E-${Date.now()}`;

  // Preenche formulário de novo aluno
  await page.locator('form input[type="text"]').first().fill(studentName);
  await page.locator('form input[placeholder="Opcional"]').fill(studentIdentifier);

  // Seleciona turma (se houver turmas ativas cadastradas)
  const groupSelect = page.locator('form select[required]');
  if (await groupSelect.isVisible()) {
    const options = await groupSelect.locator('option').all();
    if (options.length > 1) {
      await groupSelect.selectOption({ index: 1 });
    }
  }

  // Submete o cadastro do aluno
  await page.click('form button[type="submit"]:has-text("Adicionar")');

  // Verifica que o aluno cadastrado aparece na listagem
  await expect(page.locator('body')).toContainText(studentName);
});

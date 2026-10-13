import { test, expect } from '@playwright/test';
import { authenticateUser } from './helpers/auth.helper';

test('E2E-08: platform admin impersona operador de tenant', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  const email = process.env.E2E_PLATFORM_ADMIN_EMAIL || 'admin@alltech.com';
  const password = process.env.E2E_PLATFORM_ADMIN_PASSWORD || 'SenhaForte123!';

  await authenticateUser(page, email, password);
  await expect(page).toHaveURL(/\/admin\/institutions/);

  // Navega para aba Catálogo de Usuários & Suporte
  await page.click('button:has-text("Usuários")');
  await expect(page.locator('body')).toContainText(/Catálogo Global de Usuários|Entrar como/i);

  // Localiza o operador de Tenant Alpha que possui escola vinculada
  const operatorRow = page.locator('div:has-text("Operador Tenant Alpha")').filter({ hasText: 'Entrar como' }).last();
  const impersonateButton = operatorRow.locator('button:has-text("Entrar como")');
  await expect(impersonateButton).toBeVisible();
  await impersonateButton.click();

  // Preenche o motivo obrigatório no modal de impersonation (mínimo 5 caracteres)
  const reasonTextarea = page.locator('textarea');
  await expect(reasonTextarea).toBeVisible();
  await reasonTextarea.fill('Atendimento de suporte autorizado pelo protocolo E2E');

  // Submete o formulário com o botão real "Acessar como Usuário"
  const submitButton = page.locator('button:has-text("Acessar como Usuário")');
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  // Redireciona para o painel com o banner de suporte ativo
  await page.waitForURL(/\/painel/);
  await expect(page.locator('body')).toContainText(/Modo Suporte Ativo/i);

  // Encerra a sessão de impersonation
  const exitButton = page.locator('button:has-text("Encerrar e Voltar ao Admin")');
  await expect(exitButton).toBeVisible();
  await exitButton.click();

  // Retorna para o painel de administração da plataforma
  await page.waitForURL(/\/admin\/institutions/);
  await expect(page.locator('body')).not.toContainText(/Modo Suporte Ativo/i);

  await context.close();
});

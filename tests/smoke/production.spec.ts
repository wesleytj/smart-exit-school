import { test, expect } from '@playwright/test';

test('produção: página carrega', async ({ page }) => {
  const targetUrl = process.env.E2E_BASE_URL || 'https://smart-exit-school.vercel.app';
  const response = await page.goto(targetUrl);
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Smart Exit School|smart-exit-school/i);
});

test('produção: health check', async ({ request }) => {
  const targetUrl = process.env.E2E_BASE_URL || 'https://smart-exit-school.vercel.app';
  const response = await request.get(`${targetUrl}/health`);
  expect(response.status()).toBe(200);
});

test('produção: /painel redireciona usuário anônimo para /login', async ({ page }) => {
  const targetUrl = process.env.E2E_BASE_URL || 'https://smart-exit-school.vercel.app';
  await page.goto(`${targetUrl}/painel`);
  await page.waitForURL(/\/login/, { timeout: 10000 });
  expect(page.url()).toContain('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('#login-password')).toBeVisible();
});

test('produção: /update-password sem token exibe estado de link expirado ou inválido', async ({ page }) => {
  const targetUrl = process.env.E2E_BASE_URL || 'https://smart-exit-school.vercel.app';
  await page.goto(`${targetUrl}/update-password`);

  // Componente UpdatePassword possui timeout de 2s antes de definir hasValidSession = false
  const noticeHeading = page.locator('h2:has-text("Link expirado ou inválido")');
  await expect(noticeHeading).toBeVisible({ timeout: 10000 });

  // Confirma que os campos de digitação de nova senha NÃO estão presentes no DOM
  await expect(page.locator('#new-password')).toHaveCount(0);
  await expect(page.locator('#confirm-password')).toHaveCount(0);

  // Confirma links de retorno/contingência
  await expect(page.locator('a:has-text("Solicitar novo link")')).toBeVisible();
  await expect(page.locator('a:has-text("Voltar ao login")')).toBeVisible();
});


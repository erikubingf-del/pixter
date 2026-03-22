import { expect, test } from '@playwright/test';

test('shared login page does not offer phone auth', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Senha')).toBeVisible();
  await expect(page.getByRole('button', { name: /Continuar com Google/i })).toBeVisible();
  await expect(page.getByText(/Clientes e motoristas usam o mesmo login/i)).toBeVisible();
  await expect(page.getByText(/WhatsApp|telefone|código de verificação/i)).toHaveCount(0);
});

test('driver signup uses email flow instead of phone verification', async ({ page }) => {
  await page.goto('/cadastro?mode=driver');

  await expect(
    page.getByRole('heading', { name: 'Crie sua conta para receber pagamentos' })
  ).toBeVisible();
  await expect(page.getByLabel('Nome completo')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel(/Senha \(mínimo 8 caracteres\)/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Criar conta de motorista' })).toBeVisible();
  await expect(page.getByText(/WhatsApp|telefone|código de verificação/i)).toHaveCount(0);
});

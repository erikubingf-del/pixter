import { expect, test } from '@playwright/test';

test('renders the public payment page and generates a Pix code', async ({ page }) => {
  await page.route('https://js.stripe.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.Stripe = function Stripe() { return {}; };',
    });
  });

  await page.route('**/api/public/driver-info/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          id: 'driver_1',
          nome: 'Ana Motorista',
          celular: '+5511999999999',
          company_name: 'AmoPagar Teste',
          city: 'Sao Paulo',
          pix_key: 'ana@example.com',
          has_pix: true,
          has_stripe: false,
        },
      }),
    });
  });

  await page.route('**/api/pix/create-pending-payment', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'PIX-123',
      }),
    });
  });

  await page.goto('/pagamento/11999999999');

  await expect(page.getByRole('heading', { name: 'Ana Motorista' })).toBeVisible();
  await expect(page.getByText('Pagando para')).toBeVisible();
  await expect(page.getByText('Pagamento via Pix')).toBeVisible();

  await page.getByLabel('Valor do Pagamento').fill('1234');
  await page.getByRole('button', { name: /Gerar Pix/i }).click();

  await expect(page.getByRole('heading', { name: /Pague com Pix/i })).toBeVisible();
  await expect(page.getByText('Escaneie o QR Code com seu app do banco')).toBeVisible();
});

test('shows a blocked-driver message when the public driver lookup fails', async ({ page }) => {
  await page.route('https://js.stripe.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: 'window.Stripe = function Stripe() { return {}; };',
    });
  });

  await page.route('**/api/public/driver-info/**', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Motorista ainda não está pronto para receber pagamentos.',
      }),
    });
  });

  await page.goto('/pagamento/11999999998');

  await expect(page.getByRole('heading', { name: 'Erro ao carregar' })).toBeVisible();
  await expect(page.getByText('Motorista ainda não está pronto para receber pagamentos.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Voltar ao Início' })).toBeVisible();
});

import { test, expect } from '@playwright/test';

// Endpoints IBGE usados no componente
const UF_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome';
const CITIES_SP_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios?orderBy=nome';
const POP_2024_FRANCA_URL = 'https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2024/variaveis/9324?localidades=N6[3516206]';
const POP_2022_FRANCA_URL = 'https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/2022/variaveis/9324?localidades=N6[3516206]';

test.describe('Inputs Estratégicos (IBGE/TAM-SAM-SOM)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(UF_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 35, sigla: 'SP', nome: 'São Paulo' }])
      });
    });
    await page.route(CITIES_SP_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 3516206, nome: 'Franca' }])
      });
    });
    await page.route(POP_2024_FRANCA_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            resultados: [
              {
                series: [
                  {
                    localidade: { id: '3516206', nivel: 6, nome: 'Franca' },
                    serie: { '2024': '355919' }
                  }
                ]
              }
            ]
          }
        ])
      });
    });
  });

  test('Seleciona UF e município, valida TAM/SAM/SOM', async ({ page }) => {
    // Abre diretamente a aba via hash (resolve com baseURL)
    await page.goto('./#tab=16');

    const ufSelect = page.getByTestId('ibge-uf');
    const citySelect = page.getByTestId('ibge-city');
    const tamInput = page.getByTestId('tam-input');
    const samOutput = page.getByTestId('sam-output');
    const marketShareInput = page.getByTestId('market-share');
    const somOutput = page.getByTestId('som-output');

    await expect(ufSelect).toBeVisible();

    await ufSelect.selectOption('35');
    await expect(citySelect).toBeEnabled();
    await citySelect.selectOption('3516206');

    await expect(tamInput).toHaveValue('355919');
    await expect(samOutput).toContainText('177.960'); // 50% default
    await expect(marketShareInput).toHaveValue('15');
    await expect(somOutput).toContainText('26.694'); // 15% de 177.960
  });

  test('Fallback 2022: exibe badge Censo 2022 e preenche TAM', async ({ page }) => {
    // Limpa cache/localStorage antes de carregar a app
    await page.addInitScript(() => {
      try { localStorage.clear(); } catch {}
    });

    // Substitui rota de 2024 por payload sem valor → força fallback para 2022
    await page.unroute(POP_2024_FRANCA_URL);
    await page.route(POP_2024_FRANCA_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            resultados: [
              {
                series: [
                  {
                    localidade: { id: '3516206', nivel: 6, nome: 'Franca' },
                    serie: { }
                  }
                ]
              }
            ]
          }
        ])
      });
    });
    // Rota de 2022 com valor
    await page.route(POP_2022_FRANCA_URL, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            resultados: [
              {
                series: [
                  {
                    localidade: { id: '3516206', nivel: 6, nome: 'Franca' },
                    serie: { '2022': '355919' }
                  }
                ]
              }
            ]
          }
        ])
      });
    });

    await page.goto('./#tab=16');

    const ufSelect = page.getByTestId('ibge-uf');
    const citySelect = page.getByTestId('ibge-city');
    const tamInput = page.getByTestId('tam-input');

    await ufSelect.selectOption('35');
    await expect(citySelect).toBeEnabled();
    await citySelect.selectOption('3516206');

    // Deve preencher com valor de 2022 e mostrar badge
    await expect(tamInput).toHaveValue('355919');
    await expect(page.getByTestId('ibge-census-badge')).toBeVisible();
  });

  test('Cache: usa valor salvo sem nova chamada de rede', async ({ page }) => {
    // 1) Sem cache: seleciona e preenche, garantindo chamada de rede 2024
    let callsSeed = 0;
    await page.unroute(POP_2024_FRANCA_URL).catch(() => {});
    await page.route(POP_2024_FRANCA_URL, async route => {
      callsSeed++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            resultados: [
              {
                series: [
                  {
                    localidade: { id: '3516206', nivel: 6, nome: 'Franca' },
                    serie: { '2024': '355919' }
                  }
                ]
              }
            ]
          }
        ])
      });
    });

    await page.goto('./#tab=16');
    const ufSelect = page.getByTestId('ibge-uf');
    const citySelect = page.getByTestId('ibge-city');
    const tamInput = page.getByTestId('tam-input');

    await ufSelect.selectOption('35');
    await expect(citySelect).toBeEnabled();
    await citySelect.selectOption('3516206');
    await expect(tamInput).toHaveValue('355919');
    expect(callsSeed).toBeGreaterThan(0);

    // 2) Com cache: bloqueia rotas e re-seleciona a mesma cidade → não deve chamar rede
    let callsAfter = 0;
    await page.unroute(POP_2024_FRANCA_URL).catch(() => {});
    await page.unroute(POP_2022_FRANCA_URL).catch(() => {});
    await page.route(POP_2024_FRANCA_URL, route => { callsAfter++; return route.abort(); });
    await page.route(POP_2022_FRANCA_URL, route => { callsAfter++; return route.abort(); });

    // Recarrega e reseleciona para disparar handleCitySelect e usar cache
    await page.reload();
    await ufSelect.selectOption('35');
    await expect(citySelect).toBeEnabled();
    await citySelect.selectOption('3516206');

    await expect(tamInput).toHaveValue('355919');
    expect(callsAfter).toBe(0);
  });
});

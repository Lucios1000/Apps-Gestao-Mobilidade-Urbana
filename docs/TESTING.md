# Checklist de Testes — TKX Franca (detalhado)

Este documento descreve passos manuais para validar funcionalidades críticas do dashboard.

1) Preparação
- Abra o repositório no terminal:
  - `cd "e:/Repositorio VS Code Github/Lucios1000-novos-apps"`
- Instale dependências: `npm install`
- Rode checagem de tipos local: `npm run typecheck`

2) Inicialização e verificação básica
- Inicie o dev server: `npm run dev`.
- Abra a URL do Vite (ex.: `http://localhost:5173`).
- Confirme que a aplicação carrega e o cabeçalho (logo `tkx Franca`) aparece.

3) Persistência de parâmetros
- Na aba de `PARAMETRIZAÇÃO`, altere um parâmetro (ex.: `activeDrivers` → `100`).
- Abra DevTools → Application → Local Storage → `tkx_simulation_params`.
- Confirme que o valor salvo reflete a alteração no cenário ativo.

4) Cenários e projeções
- Mude o `scenario` para `Pessimista` / `Otimista` e observe `projections` atualizar.
- Valores para teste:
  - Pessimista: `activeDrivers: 30`, `avgFare: 16.0`, `userGrowth: 5`
  - Otimista: `activeDrivers: 150`, `avgFare: 22.0`, `userGrowth: 25`
- Verifique o teto de frota (`driverCap`) muda conforme `ScenarioType` (800/2000/3000).

5) Interrupção de manutenção (regra específica)
- Em `PARAMETRIZAÇÃO`, desative `isMaintenanceActive`.
- Resultado esperado: `projections` para todos os meses devem retornar zeros (exceto `accumulatedProfit` negativo inicial). Isso confirma a proteção implementada em `services/financeEngine.ts`.

6) Auditoria anual (DRE)
- Vá para a aba `DRE` e confirme que `audits` contém resumo por ano (2026, 2027, 2028).
- Valores a validar: `totalRevenue`, `totalNetProfit`, `avgMonthlyProfit` e `bestMonth`/`worstMonth`.

7) Export / Impressão
- No cabeçalho, clique em `Exportar PDF / Imprimir` e em `Exportar Excel (CSV)`.
- Confirme que os callbacks `onExportPDF` e `onExportExcel` são chamados (implemente handlers temporários se necessário para testar).

8) Casos extremos e sanity checks
- Teste `activeDrivers = 0` e `avgFare = 0` → garantir que não ocorra divisão por zero e que app se comporte com zeros.
- Teste crescimento de usuários muito alto (e.g., `userGrowth = 200`) e confirme saturação em `MAX_USERS_SCENARIO`.

9) Reset e rollback
- Use `resetParams()` no hook (ou botão de UI, se houver) para retornar aos `DEFAULT_VALUES`.
- Confirme limpeza/normalização do `localStorage` salvo.

10) Logs e depuração
- Erros de tipagem: execute `npm run typecheck` e corrija arquivos apontados.
- Erros de runtime: abra DevTools → Console e trace stack; checar `services/financeEngine.ts` e `hooks/useViability.ts` quando as projeções não baterem.

Se quiser, eu posso transformar estes passos em uma checklist interativa (Markdown com caixas de verificação) ou adicionar testes automatizados básicos com Playwright/Cypress. Diga qual prefere.

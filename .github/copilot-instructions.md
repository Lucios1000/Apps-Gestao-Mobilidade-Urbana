## Objetivo rápido
Ajude a desenvolver e manter o dashboard de viabilidade financeira (TKX Franca). Seja preciso: siga as convenções de pasta e as assinaturas das funções existentes.

## Visão geral da arquitetura
- Frontend: Vite + React (arquivos de entrada: `main.tsx`, `App.tsx`). UI composta por componentes em `components/` (ex.: `Layout.tsx`).
- Lógica de negócio: motor financeiro em `services/financeEngine.ts` — central para todas as projeções e auditorias.
- Estado e UX: hooks locais/compostos em `useViability.ts` (na raiz) e `hooks/useViability.ts` (mais completo). Atentar para duplicação (ver seção "Atenção à duplicação").
- Tipos e constantes: `types.ts` e `constants.ts` definem contratos e parâmetros padrão (ex.: `INITIAL_PARAMS`, `STORAGE_KEY`).

## Scripts / Como rodar
- Instalar dependências: `npm install`.
- Desenvolvimento: `npm run dev` (Vite).
- Build: `npm run build`.
- Preview do build: `npm run preview`.

## Padrões e convenções do projeto
- Tipos centralizados em `types.ts`. Use estes tipos em novas funções e componentes.
- Parâmetros de simulação e chaves: `constants.ts` exporta `INITIAL_PARAMS` e `STORAGE_KEY` (`tkx_simulation_params`). Use esse STORAGE_KEY ao ler/gravar localStorage.
- Motor financeiro: `calculateProjections(params, scenario)` e `auditYears(results)` em `services/financeEngine.ts`. Prefira invocar passando o `scenario` quando necessário.
- UI layout: `Layout.tsx` define navegação por abas. Controle de aba é um inteiro (`activeTab`) — preserve esse padrão nas props.

## Atenção à duplicação e inconsistências conhecidas
- Existem duas implementações de `useViability`:
  - `useViability.ts` (raiz) — implementação simples (exporta `params` e chama `calculateProjections(params)` sem `scenario`).
  - `hooks/useViability.ts` — versão mais completa que usa `ScenarioType`, persiste no `localStorage` com `STORAGE_KEY`, expõe helpers (`updateParam`, `resetParams`) e chama `calculateProjections(currentParams, scenario)` corretamente.

Ao modificar lógica central siga uma destas estratégias (consistente com o escopo da mudança):
- Se sua alteração impacta o app em execução (`App.tsx` importa `./useViability`), atualize a versão na raiz ou altere `App.tsx` para importar `./hooks/useViability` e remova/arquive a versão antiga.
- Evite editar apenas a cópia sem alinhar imports; isso causa divergência e erros de tipos (a assinatura de `calculateProjections` requer `scenario`).

## Integrações e dependências externas
- Dependências listadas em `package.json`: `react@19`, `react-dom`, `recharts`, `lucide-react`, Vite e TypeScript.
- Nenhuma API externa é chamada por padrão no código atual. O README menciona `GEMINI_API_KEY` para AI Studio, mas o código do app não depende disso diretamente — verifique antes de adicionar integrações.

## Pontos de entrada úteis para mudanças comuns
- Ajustar parâmetros de simulação: `constants.ts` (`INITIAL_PARAMS`) e `hooks/useViability.ts` (`DEFAULT_VALUES`).
- Alterar regras de negócio (ex.: take rate, churn): `services/financeEngine.ts` — este arquivo contém a maior parte da matemática e regras de negócio.
- Alterar visual / aba: `components/Layout.tsx` e `components/FinancialTable.tsx`.
- Persistência de parâmetros: `hooks/useViability.ts` utiliza `localStorage` com `STORAGE_KEY` — mantenha compatibilidade ao mudar formato salvo (versionamento recomendado).

## Regras práticas para PRs e edições de agente
- Antes de editar, busque por duplicatas (ex.: `useViability`) e escolha uma única fonte canônica para alterações.
- Escreva mudanças de tipos em `types.ts` e atualize todas referências; rode `tsc` ou `vite` para detectar erros de tipagem.
- Teste manualmente: `npm run dev` e verifique o painel. Para checar persistência, inspecione `localStorage` no browser (`tkx_simulation_params`).

## Exemplos rápidos (trechos relevantes)
- Chamada correta do motor:
  - `calculateProjections(currentParams, scenario)` — veja `hooks/useViability.ts`.
- Chave de localStorage:
  - `STORAGE_KEY` é exportada de `constants.ts` e vale `tkx_simulation_params`.

## O que pedir ao usuário (se necessário)
- Confirme qual `useViability` deve ser canônico (raiz vs `hooks/`).
- Se houver migração de formato salvo, confirme política de migração (ou descartar/normalizar automaticamente).

Se algo desta instrução estiver incorreto ou incompleto, diga especificamente qual arquivo ou comportamento quer que eu revise e eu atualizo este guia.

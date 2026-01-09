# Snapshots e Restauração

Este diretório contém artefatos de snapshot para facilitar voltar ao estado anterior do app.

## Opções de Restauração

- Por Tag (recomendado):
  1. Listar tags: `git tag --list "snapshot-*"`
  2. Trocar para uma tag: `git checkout <tag>`
  3. Voltar ao desenvolvimento: `git switch -` (retorna à branch anterior)

- Por Branch de backup:
  1. Listar branches: `git branch -a | Select-String backup/snapshot`
  2. Trocar para a branch: `git checkout backup/<nome-da-branch>`
  3. Criar uma branch de trabalho a partir do snapshot: `git switch -c work/from-snapshot`

- Por Release com zips:
  - Baixe os zips na página de Releases:
    - `source-<tag>.zip`: código-fonte do snapshot (HEAD da tag)
    - `dist-<tag>.zip`: build de produção do snapshot
  - Para servir o `dist`: extraia e use um servidor estático (ex.: `npx serve dist`)

## Snapshots Atuais

- Snapshot descritivo (pré-mudanças): `snapshot-pre-refactor-campanhas-YYYYMMDD-HHmm`
  - Branch: `backup/snapshot-pre-refactor-campanhas-YYYYMMDD-HHmm`
  - Release: contém `source-<tag>.zip` e `dist-<tag>.zip`

## Fluxos Comuns

- Voltar temporariamente ao snapshot:
  - `git checkout <tag>` → inspecionar/rodar
  - `git switch -` → retornar à branch de trabalho

- Criar nova base de trabalho a partir do snapshot:
  - `git checkout <tag>`
  - `git switch -c feat/novo-trabalho-do-snapshot`

- Comparar mudanças entre o estado atual e o snapshot:
  - `git diff <tag>..HEAD`

## Observações

- As tags são imutáveis e ótimas como pontos de restauração.
- As branches de backup ajudam em diffs e navegação, mas não são obrigatórias se você usar apenas tags e releases.

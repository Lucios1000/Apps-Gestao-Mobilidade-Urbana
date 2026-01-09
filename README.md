<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TKX Franca — Dashboard de Viabilidade Financeira

[![Deploy](https://github.com/Lucios1000/Lucios1000-novos-apps/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/Lucios1000/Lucios1000-novos-apps/actions/workflows/deploy.yml)
[![E2E](https://github.com/Lucios1000/Lucios1000-novos-apps/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/Lucios1000/Lucios1000-novos-apps/actions/workflows/e2e.yml)
[![Lighthouse](https://github.com/Lucios1000/Lucios1000-novos-apps/actions/workflows/lighthouse.yml/badge.svg?branch=main)](https://github.com/Lucios1000/Lucios1000-novos-apps/actions/workflows/lighthouse.yml)
[![Typecheck](https://github.com/Lucios1000/Lucios1000-novos-apps/actions/workflows/typecheck.yml/badge.svg?branch=main)](https://github.com/Lucios1000/Lucios1000-novos-apps/actions/workflows/typecheck.yml)
[![Release](https://github.com/Lucios1000/Lucios1000-novos-apps/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/Lucios1000/Lucios1000-novos-apps/actions/workflows/release.yml)

- Live Demo: https://lucios1000.github.io/Lucios1000-novos-apps/
- Instalação PWA: abra a demo no Chrome/Edge → “Instalar app”
 - Releases: https://github.com/Lucios1000/Lucios1000-novos-apps/releases

Snapshots
- Último snapshot (Pré-mudanças — Campanhas): https://github.com/Lucios1000/Lucios1000-novos-apps/releases/tag/snapshot-pre-refactor-campanhas-20260108-1902

Nota: PRs em `feat/*` com label `automerge` têm auto-merge (squash) habilitado quando os checks obrigatórios passam.

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16CoDYIkv6eejdIsPcIPLxcFAkmD4NQQT

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Factory is a headless CMS boilerplate monorepo: **TYPO3 13.4** backend + **Nuxt 4** frontend. A shared `factory-core` library provides reusable components consumed by client projects (like `client-dummy`) via Composer path repositories and Nuxt layer extends.

## Repository Structure

- **`factory-core/`** — Shared library
  - `nuxt-layer/` — Nuxt layer with Vue components (extended by client frontends)
  - `typo3-extension/` — TYPO3 extension `factory_core` with Content Blocks and InitSeederCommand
  - `templates/` — Boilerplate templates for scaffolding new client projects (placeholders: `{{PROJECT_NAME}}`, `{{PROJECT_NAME_UNDERSCORE}}`, `{{PROJECT_LABEL}}`, etc.)
  - `manifest.json` — Component registry with versions and dependencies
- **`client-dummy/`** — Reference client implementation (backend + frontend, each with Docker setup)
- **`.design-log/`** — Architecture decision records

## Component Activation Pattern

The central design pattern: a `factory.json` file in each client project declares `active_components`. Both Nuxt and TYPO3 read this same contract:
- **Frontend**: `factory-components.ts` Nuxt module uses `components:extend` hook to remove inactive Vue components before build
- **Backend**: `client_sitepackage/ext_localconf.php` manipulates TCA to hide inactive CTypes from the TYPO3 editor

Component naming convention: PascalCase filenames → kebab-case slugs (e.g., `PageHero.vue` → `page-hero`).

## Development Commands

### Frontend (`client-dummy/frontend/app/src/`)
```bash
npm start          # nuxt dev (HTTPS on port 443)
npm run build      # production build
npm run preview    # preview built app
npm run prepare    # nuxt prepare
```

### Backend
Backend runs in Docker. Composer manages dependencies via `src/composer.json`. Factory-core is consumed as a path repository with symlink.

### Docker
```bash
lab up              # orchestrate startup (used by .up.sh)
docker compose up   # from client-dummy/backend/app/ or frontend/app/
```

### Tests
Playwright visual regression tests in `client-dummy/backend/app/tests/`. Run via the `test` Docker service (labordigital/playwright:1.56.1).

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript, Tailwind CSS, @t3headless/nuxt-typo3, @nuxt/ui
- **Backend**: PHP 8.4, TYPO3 13.4, friendsoftypo3/headless, friendsoftypo3/content-blocks, netzbewegung/nb-headless-content-blocks
- **Infrastructure**: Docker, MariaDB 12.0, LABOR.digital base images, Playwright

## Docker Shell Scripts Pattern

Each Docker app has an `opt/` directory with lifecycle hooks:
- `bootstrap.sh` — runs on every container boot
- `build.sh` — runs during image build AND first dev boot
- `development.sh` — runs on every dev container boot
- `directories.sh` / `permissions.sh` — setup helpers

## Design Log Methodology

The project follows a rigorous design log methodology for all significant features and architectural changes.

### Before Making Changes
1. Check design logs in `.design-log/` for existing designs and implementation notes
2. For new features: Create design log first, get approval, then implement
3. Read related design logs to understand context and constraints

### When Creating Design Logs
1. Structure: Background → Problem → Questions and Answers → Design → Implementation Plan → Examples → Trade-offs
2. Be specific: Include file paths, type signatures, validation rules
3. Show examples: Use ✅/❌ for good/bad patterns, include realistic code
4. Explain why: Don't just describe what, explain rationale and trade-offs
5. Ask Questions (in the file): For anything that is not clear, or missing information
6. When answering questions: keep the questions, just add answers
7. Be brief: write short explanations and only what is most relevant
8. Draw Diagrams: Use mermaid inline diagrams when it makes sense

### When Implementing
1. Follow the implementation plan phases from the design log
2. Write tests first or update existing tests to match new behavior
3. Do not update design log initial sections once implementation started
4. Append design log with "Implementation Results" section as you go
5. Document deviations: Explain why implementation differs from design
6. Run tests: Include test results (X/Y passing) in implementation notes
7. After implementation add a summary of deviations from original design

### When Answering Questions
1. Reference design logs by number when relevant (e.g., "See Design Log #001")

## Environment Files

- `.env` — Docker Compose variables (changes recreate container)
- `.env.app` — Application secrets (mounted as volume, survives restart)
- `.env.template` / `.env.app.template` — Source of truth for available variables

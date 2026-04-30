# Factory

A headless CMS boilerplate monorepo: **TYPO3 13.4** backend + **Nuxt 4** frontend, scaffolded from a shared `factory-core` library and orchestrated through a web-based pipeline runner.

## What's in this repo

| Path | Purpose |
| --- | --- |
| `factory-core/` | Shared library consumed by client projects. Contains the Nuxt layer, TYPO3 extension, boilerplate templates, and the component manifest. |
| `pipeline-app/` | SvelteKit app that scaffolds new client projects, injects components, and bootstraps Docker — a UI replacement for `test-pipeline.sh`. |
| `test-pipeline.sh` | Legacy bash pipeline runner (Phases 0–3). Kept for reference; prefer `pipeline-app`. |
| `.design-log/` | Architecture decision records. Read these before making significant changes. |
| `CLAUDE.md` | Project conventions and guidance. |

Generated client projects (matching `test-*/`) are gitignored.

## factory-core

```
factory-core/
├── manifest.json         # Component registry: versions + npm/composer dependencies
├── nuxt-layer/           # Vue components, composables, plugins (extended by client frontends)
├── typo3-extension/      # TYPO3 extension `factory_core` — Content Blocks + InitSeederCommand
├── templates/            # Boilerplate for new client projects (backend + frontend)
│   └── …                 # Placeholders: {{PROJECT_NAME}}, {{PROJECT_NAME_UNDERSCORE}}, {{PROJECT_LABEL}}
└── playground/           # Standalone Nuxt app for component development
```

### Component activation pattern

A `factory.json` file at the root of each client project declares which components are active:

```json
{
  "core_version": "1.0.0",
  "active_components": ["PageHero", "PageSection", "Button"]
}
```

Both runtimes read the same contract:

- **Frontend** — `factory-components.ts` Nuxt module uses the `components:extend` hook to strip inactive Vue components before build.
- **Backend** — `client_sitepackage/ext_localconf.php` manipulates TCA to hide inactive CTypes from the TYPO3 editor and removes their ContentBlock entries.

Component naming: PascalCase filenames map to kebab-case slugs (`PageHero.vue` → `page-hero`).

## Pipeline app

Web UI at `pipeline-app/` (SvelteKit 2 + Svelte 5 + Tailwind v4). Run it locally to:

1. Pick a project name and a subset of components from `factory-core/manifest.json`.
2. Stream scaffolding, component injection, and Docker bootstrap output to the browser over NDJSON.
3. Authenticate sudo in-app and hash the TYPO3 Install Tool password server-side.
4. Land on a success page with frontend/backend URLs and credentials.

```bash
cd pipeline-app
npm install
npm run dev
```

See `.design-log/004-pipeline-app.md` for the full design.

## Tech stack

- **Frontend** — Nuxt 4, Vue 3, TypeScript, Tailwind CSS, `@t3headless/nuxt-typo3`, `@nuxt/ui`
- **Backend** — PHP 8.4, TYPO3 13.4, `friendsoftypo3/headless`, `friendsoftypo3/content-blocks`, `netzbewegung/nb-headless-content-blocks`
- **Pipeline** — SvelteKit 2, Svelte 5, Tailwind v4, `lucide-svelte`, `@zerodevx/svelte-toast`
- **Infrastructure** — Docker, MySQL 8.4, LABOR.digital base images, Playwright 1.56

## Development

### Scaffolding a new client project

Use `pipeline-app` (or `test-pipeline.sh --full` for a headless run). Both consume `factory-core/templates/`, replace placeholders, wire `factory-core` as a Composer path repository and a Nuxt layer, and boot the Docker stack.

### Frontend (inside a client project)

```bash
cd <client>/frontend/app/src
npm start          # nuxt dev (HTTPS on port 443)
npm run build      # production build
npm run preview    # preview built app
```

### Backend (inside a client project)

Runs in Docker. Composer dependencies are managed in `src/composer.json`; `factory-core` is consumed as a path repository with a symlink.

```bash
lab up             # orchestrated startup used by .up.sh
docker compose up  # from <client>/backend/app/ or frontend/app/
```

### Tests

Playwright visual regression tests live under each client's `backend/app/tests/`. They run via the `test` Docker service (`labordigital/playwright:1.56.1`).

## Environment

- `.env` — Docker Compose variables (changes recreate the container)
- `.env.app` — Application secrets (mounted as a volume, survives restart)
- `.env.template` / `.env.app.template` — Source of truth for available variables
- Extra runtime secrets are managed via Doppler, not `.env.app`

## Design log workflow

Significant features go through the design log in `.design-log/` before implementation:

1. Background → Problem → Questions → Design → Implementation Plan → Examples → Trade-offs
2. Append an "Implementation Results" section while building, including deviations and test results.
3. Reference existing logs by number (e.g. "See Design Log #004") when discussing related work.

## License

This repository is published under a split licensing scheme:

- **Default — Source Available (All Rights Reserved)**: the root [`LICENSE`](./LICENSE) permits reading and auditing the code, but not using, redistributing, or modifying it. Production and commercial use require a separate written agreement with LABOR.digital.
- **GPL-2.0-or-later**: `factory-core/typo3-extension/` and `factory-core/templates/backend/` each carry their own `LICENSE` with the GNU General Public License, version 2 or later, because they are loaded into the TYPO3 runtime.

See [`LICENSES.md`](./LICENSES.md) for the full map and the rationale behind the split. To request a commercial license, contact LABOR.digital.

## Trademarks

"LABOR.digital" and "Factory", together with any associated logos or brand elements, are trademarks and trade names of LABOR.digital. The licenses in this repository grant rights to the *code* only — not to these marks. You may not use these names or marks to endorse or promote derived products, or to imply sponsorship or affiliation, without prior written permission.

Fair nominative use — for example, stating that your own product is "compatible with Factory" or "integrates with LABOR.digital Factory" — is permitted, provided it does not suggest endorsement and does not alter the marks.

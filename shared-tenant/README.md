# `shared-tenant/` — Multi-Tenant TYPO3 Instance

Reference implementation of the shared-tenant pattern from
[.design-log/011-multi-tenant-typo3.md](../.design-log/011-multi-tenant-typo3.md).

One TYPO3 + one MariaDB serves many small clients; each client is a **site**
in `src/config/sites/{tenant-slug}/` with its own `config.yaml` and
`factory.json`. `factory-core` + `client_sitepackage` are shared across all
tenants; per-tenant CType/RecordType gating happens at request time via
`TenantCTypeRestrictionListener`, and `TenantScopeEnforcer` guards every
DataHandler write from crossing tenant boundaries.

## Layout

```
shared-tenant/
└── backend/
    └── app/
        ├── Dockerfile
        ├── docker-compose.yml
        ├── factory-core -> ../../factory-core     (symlink → path repo)
        ├── lab.boilerplate.json
        ├── opt/                                   (bootstrap/build/etc.)
        ├── .env.template, .env.app.template       (copy → .env, .env.app)
        └── src/
            ├── composer.json
            ├── config/
            │   ├── sites/               ← empty; populated by `factory:tenant:provision`
            │   └── system/
            ├── packages/client_sitepackage/
            └── public/
                └── fileadmin/           ← per-tenant subdirs live here
```

**Key differences from `test-client-auto/`:**

| | `test-client-auto/` (dedicated) | `shared-tenant/` (this) |
| --- | --- | --- |
| `src/factory.json` | present | **absent** — sites own theirs |
| `src/config/sites/` | one site (`factory_base`) | empty; one dir per tenant |
| `src/public/fileadmin/` | flat shared pool | partitioned `fileadmin/{slug}/` |
| Per-tenant `be_groups` | none (single team) | one editor + one admin group per tenant |

## First-time bring-up

1. Copy env templates:
   ```bash
   cd shared-tenant/backend/app
   cp .env.template .env
   cp .env.app.template .env.app
   ```
   Fill in `COMPOSE_PROJECT_NAME`, `APP_DOMAIN`, `APP_*_DIR`, `APP_MYSQL_*`,
   `APP_ENCRYPTION_KEY`, `APP_INSTALL_TOOL_PASSWORD`, etc. `APP_DOMAIN` is the
   admin / BE hostname (e.g. `admin.factory.local`); tenant frontends get
   their own hostnames via per-site `config.yaml`.

2. Bring the stack up (same commands as any other Factory client):
   ```bash
   lab up
   # or: docker compose up -d
   ```

3. Run the TYPO3 setup wizard once to create the global admin and
   initialize the DB:
   ```bash
   docker compose exec app vendor/bin/typo3 setup
   ```

4. Provision the first tenant:
   ```bash
   docker compose exec app vendor/bin/typo3 factory:tenant:provision \
     --slug=acme \
     --domain=acme.example.com \
     --display-name="ACME GmbH" \
     --components=PageHero,Text,PageSection \
     --admin-email=ops@acme.example.com
   ```
   This creates the root page + perms, the editor + admin be_groups, the
   `sys_filemount`, `config/sites/acme/{config.yaml,factory.json}`, and the
   initial tenant-admin user. The command prints a one-time password for that
   user — rotate immediately.

5. Per-tenant Nuxt frontends are scaffolded independently (the shared
   instance doesn't bundle them). Point each tenant's frontend at
   `APP_DOMAIN` and its tenant slug's site.

## End-to-end testing the multitenant API locally

This fixture doubles as the local test bed for `factory-multitenant-api`
(DL #013) and pipeline-app's staging-target flow (DL #015) — no DevOps
staging required.

What's already wired:
- `factory-core/typo3-multitenant-api/` is mounted at
  `/var/www/modules/typo3-multitenant-api` (docker-compose volume).
- `src/composer.json` has the matching path repo + `@dev` require.
- `FACTORY_MULTITENANT_API_ENABLED=true` and
  `FACTORY_MULTITENANT_API_TOKEN=dev-multitenant-token` are set in the
  app service's `environment:` block. The placeholder token is
  intentional — the production deploy uses Secrets Manager (DL #013).

To bring the stack up against the API:

```bash
cd shared-tenant/backend/app
docker compose up -d --wait
docker compose exec app composer install   # picks up factory-multitenant-api
```

Verify the API responds:

```bash
curl -k -H "Authorization: Bearer dev-multitenant-token" \
  https://${APP_DOMAIN}/api/multitenant/version
# expect: {"factory_core_version":"0.2.0","factory_multitenant_api_version":"0.1.1",...}
```

Without the bearer or with a wrong one → 401. With
`FACTORY_MULTITENANT_API_ENABLED` unset → 404 (off-by-default).

### Pointing pipeline-app at this fixture

In `pipeline-app/.env`:

```
STAGING_API_TOKEN=dev-multitenant-token
```

Restart the dev server so SvelteKit re-reads the env. Then in the UI:

1. Open `/seeds`, pick a seed whose `core_version` is `^0.2`
   (the bootstrap example `example-modern-blue` already qualifies).
2. Click "Use" → form pre-fills.
3. In the form's environment selector, switch to **Staging**.
4. Set the base URL to `https://${APP_DOMAIN}` (whatever you set in
   `shared-tenant/backend/app/.env`).
5. The version-compat badge should go green within ~1s.
6. Click **Run Pipeline**. Pipeline-app skips Phases 0/3/4 and runs
   the staging phase: `POST /tenants` → poll → (optional) `flyctl deploy`.

The `flyctl deploy` step is skipped automatically when `FLY_API_TOKEN`
is unset — the tenant still gets provisioned in TYPO3.

### Tearing down a test tenant

```bash
# delete site config
rm -rf src/config/sites/<slug>

# delete root page + content
docker compose exec app vendor/bin/typo3 factory:tenant:audit
# follow audit findings to clean orphans, or DataHandler-delete the rootline
```

A `factory:tenant:retire` CLI is on the v2 backlog — for now manual.

## Auditing

Run the defense-in-depth audit any time:
```bash
docker compose exec app vendor/bin/typo3 factory:tenant:audit
```
Exit 0 = clean, exit 1 = findings with a per-row report. Wire it to
cron/CI for nightly runs.

## Shutting down a tenant

No CLI command for this yet. Manual process:
1. Remove `config/sites/{slug}/`.
2. Delete the tenant's root page subtree via the TYPO3 BE (or DataHandler).
3. Delete the tenant's `sys_filemount` and the `fileadmin/{slug}/` directory.
4. Delete the per-tenant `be_groups` and any users whose only membership was
   in those groups.
5. Run `factory:tenant:audit` and expect zero findings.

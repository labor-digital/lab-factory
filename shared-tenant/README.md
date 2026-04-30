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

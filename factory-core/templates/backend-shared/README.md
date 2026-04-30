# `backend-shared/` — Shared-Tenant Boilerplate

This template scaffolds a **shared-tenant** TYPO3 instance: one TYPO3 + one
DB + many sites, each site = one small client. See
[.design-log/011-multi-tenant-typo3.md](../../../.design-log/011-multi-tenant-typo3.md)
for the full design.

## Relationship to `backend/`

The shared-tenant instance shares ~100% of its code with the dedicated
`templates/backend/`. The differences are entirely in **which files are
present at scaffolding time**, not in code:

| File / dir | `backend/` (dedicated) | `backend-shared/` (this template) |
| --- | --- | --- |
| `src/factory.json` | present, authoritative | **absent** — each site owns its own |
| `src/config/sites/main/` | present, single site | empty — sites are added by the provisioning command |
| `src/public/fileadmin/` | single shared pool | partitioned per-tenant (`fileadmin/{slug}/`) |
| `src/packages/client_sitepackage/` | identical | identical |
| `factory_core` extension | loaded | loaded |

The two TCA override files
[`hide_inactive_content_blocks.php`](../backend/src/packages/client_sitepackage/Configuration/TCA/Overrides/hide_inactive_content_blocks.php)
and
[`hide_inactive_records.php`](../backend/src/packages/client_sitepackage/Configuration/TCA/Overrides/hide_inactive_records.php)
self-detect shared-tenant mode via
`FactoryComponentRegistry::hasAnySiteConfig()` and no-op when any
`config/sites/*/factory.json` is present. In shared-tenant mode the per-site
gating comes from `TenantCTypeRestrictionListener` on the
`ModifyLoadedPageTsConfigEvent` instead.

## Bootstrapping a shared-tenant instance

1. Copy the dedicated template scaffolding:
   ```bash
   cp -R factory-core/templates/backend shared-tenant
   ```
2. Delete the project-root `factory.json`:
   ```bash
   rm shared-tenant/src/factory.json
   ```
3. Remove the boilerplate single-site config:
   ```bash
   rm -rf shared-tenant/src/config/sites/main
   ```
4. Bring the stack up (`docker compose up`), run the TYPO3 setup wizard, then
   provision each tenant with
   ```bash
   docker compose exec web vendor/bin/typo3 factory:tenant:provision \
     --slug=acme --domain=acme.example.com --display-name="ACME GmbH" \
     --components=PageHero,Text,PageSection \
     --admin-email=ops@acme.example.com
   ```

## Why not fully duplicate the template?

Every file under `backend/src/packages/` and `backend/opt/` is identical in
shared mode. Duplicating would double the maintenance cost for no gain. The
pipeline-app's `deployment_mode=shared-tenant` branch uses the `backend/`
scaffolding and applies the three deletions above automatically (see
[pipeline-app/src/lib/pipeline/executor.ts](../../../pipeline-app/src/lib/pipeline/executor.ts)).

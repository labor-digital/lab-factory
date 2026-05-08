# Factory Multitenant API

HTTP API for the LABOR.digital Factory shared-tenant TYPO3. Wraps `factory-core`'s tenant primitives so the pipeline-app (and other tooling) can create tenants and update their capabilities without a redeploy.

> **Opt-in.** Single-tenant Factory installs should NOT install this extension. It exposes shared-tenant operations that don't apply to dedicated stacks.

## Endpoints

All routes live under `/api/multitenant`. JSON in, JSON out. Bearer auth.

| Method | Path | Description |
|---|---|---|
| `GET` | `/version` | Deployed `factory_core` + `factory_multitenant_api` + TYPO3 versions plus the supported seed-schema range. |
| `GET` | `/tenants` | List all tenants (anything with a `config/sites/<slug>/factory.json`). |
| `GET` | `/tenants/{slug}` | One tenant. |
| `POST` | `/tenants` | Create a tenant. Wraps `factory:tenant:provision`. |
| `PATCH` | `/tenants/{slug}` | Update capabilities (`active_components`, `active_record_types`, `settings`). Atomic rewrite of `factory.json` + cache invalidate; takes effect immediately on the worker handling the PATCH. |

## Activation

The middleware is **off by default**. To turn the API on, set both:

```sh
FACTORY_MULTITENANT_API_ENABLED=true
FACTORY_MULTITENANT_API_TOKEN=<random-32+-char-secret>
```

Without both env vars, every `/api/multitenant/*` request returns 404. With them set, requests must present `Authorization: Bearer <token>`.

The deploy repo (`labor-factory-multitenant`) injects both via AWS Secrets Manager. See its private docs for the exact wiring.

## Hardening checklist (production)

1. ALB rule for `/api/multitenant/*` restricted to a CIDR allowlist (LABOR offices + Bitbucket Pipelines egress).
2. Bearer token rotated quarterly.
3. CloudWatch log filter on `factory_multitenant_api rejected` → ops alert.
4. `FACTORY_MULTITENANT_API_ENABLED` left unset on any non-shared-tenant deploy.

## See also

- Design Log #013 — Multitenant API & Live Capability Updates
- Design Log #011 — Multi-Tenant TYPO3
- `labor-digital/factory-core` — the underlying tenant primitives

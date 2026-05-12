# 016 — Tenant Lifecycle: Content Seed, Retire, Update Mode

## Background

DL #013 shipped the multitenant API with `POST/PATCH/GET /tenants`. The first
end-to-end run (heckelsmüller → staging → Fly) surfaced two gaps:

1. **`POST /tenants` provisions the *infrastructure*** (root page, be_groups,
   sys_filemounts, site config, admin user) but never seeds content. The
   frontend boots against an empty page tree → blank Nuxt render.
2. **No way to iterate without re-creating.** Once a tenant exists, the
   operator's only path to update it is `PATCH /tenants/{slug}` for
   activation/settings. There's no "re-seed content" or "redeploy frontend"
   step that operates on an existing tenant. And there's no way to delete
   one — failed provisioning attempts leave orphan root pages + be_groups
   that have to be removed manually via the BE.

## Problem

- An operator-friendly tenant lifecycle needs: create → seed content →
  iterate on content + theming → eventually retire. Today only step 1 (sort
  of, without content) works through the API.
- Failed provisioning leaves residue. Without `DELETE /tenants/{slug}` the
  cleanup is manual + error-prone (delete pages, delete groups, delete
  filemounts, delete site config dir).
- Pipeline-app's staging path is hard-wired to "create new" — the form
  always POSTs. An operator who wants to redeploy the frontend after a code
  change shouldn't have to scaffold + POST + poll.

## Questions and Answers

1. **Where does content seeding live — extend `POST /tenants` or add a
   new route?**
   — New route: `POST /tenants/{slug}/content`. Single-purpose endpoint that
   wipes the tenant's existing tt_content on the root page and seeds the
   posted elements. Idempotent (you can call it repeatedly to iterate on
   content without re-provisioning). Keeps `POST /tenants` to one
   responsibility (infrastructure), which makes failure recovery easier.

2. **Does the API need access to the seed library to seed content?**
   — No. Pipeline-app loads the seed locally (it owns the picker), extracts
   the `elements[]` + relevant `settings`, and POSTs them inline as the
   request body. The staging instance stays oblivious to the seed library —
   it just receives content and writes it. This also means private/customer
   seeds in `labor-factory-seeds` never need to be mirrored to staging.

3. **What does retire delete?**
   — Six things, atomically (best-effort):
     1. All `pages` rows under the tenant root (recursive — content elements
        and record-table rows go with them via DataHandler cascade).
     2. `be_groups`: `tenant_{slug}_editor` + `tenant_{slug}_admin`.
     3. `sys_filemounts`: `tenant_{slug}`.
     4. Records in `tx_factorycore_*` referencing those pages.
     5. The site config dir `config/sites/{slug}/`.
     6. The fileadmin dir `public/fileadmin/{slug}/` (the symlink target on
        EFS).
   — Does NOT delete: the tenant-admin `be_user` row (might be reused
     across tenants), or rows in shared tables (sys_log, sys_history) for
     auditability.

4. **How does pipeline-app's form know whether to "create" or "update"?**
   — Operator chooses explicitly via a mode toggle. Auto-detection (does
     the tenant exist on staging?) sounds nice but adds API round-trips
     and is error-prone when the operator is iterating on a slug that
     doesn't exist yet. Manual is honest.

5. **What's the simplest "update" UX without a tenant DB?**
   — Text input for the tenant slug. Operator types it (or pastes from
     a previous run's log). Pipeline-app calls operations against that
     slug. Future work: backfill from `GET /tenants` into a picker
     dropdown; eventually a SQLite-backed history (out of scope here).

## Design

### A. Two new API routes

```
POST   /api/multitenant/tenants/{slug}/content
DELETE /api/multitenant/tenants/{slug}
```

**`POST /tenants/{slug}/content`**

Body:
```json
{
  "elements": [
    { "component": "page-hero", "data": { ... } },
    { "component": "page-section", "data": { ... } }
  ],
  "wipe": true
}
```

- `elements`: same shape as in seed.json (kebab-case component slug + data
  override map).
- `wipe`: when true (default), drop existing tt_content on the root page
  before seeding. When false, append. False is rare; mainly for testing.

Response:
```json
{
  "slug": "heckelsmueller-test-1",
  "root_page_id": 17,
  "seeded": 4,
  "wiped": 2,
  "status": "seeded"
}
```

**`DELETE /tenants/{slug}`**

Body: empty. Response:
```json
{
  "slug": "heckelsmueller-test-1",
  "deleted": {
    "pages": 7,
    "be_groups": 2,
    "sys_filemounts": 1,
    "record_rows": 0,
    "site_config_dir": true,
    "fileadmin_dir": true
  },
  "status": "retired"
}
```

Both routes go through `AuthenticationMiddleware` (bearer required).

### B. factory-core: two new services

`Classes/Service/TenantContentSeeder.php`:
- Dependencies: `ContentBlockSeeder`, `ConnectionPool`, `SiteFinder`.
- `seed(string $siteIdentifier, array $elements, bool $wipe): array` — returns
  `{root_page_id, seeded_count, wiped_count}`.
- Bootstraps admin BE user (mirrors the existing pattern in `ResetSeederCommand`).
- Wipes `tt_content` on root page if `wipe` (`DELETE FROM tt_content WHERE pid = ?`).
- Builds a single DataHandler datamap from elements, executes once.
- Returns counts for the API response.

`Classes/Service/TenantRetirementService.php`:
- Dependencies: `ConnectionPool`, `SiteFinder`.
- `retire(string $siteIdentifier): array` — returns the `deleted` object.
- Resolves root page; recursively collects descendant page UIDs.
- Three SQL DELETEs (pages, be_groups, sys_filemounts) + filesystem `rm -rf` of
  site config dir and fileadmin dir.
- Wrapped in best-effort error handling: a missing be_group or sys_filemounts
  row is fine (idempotent retire).

### C. factory-multitenant-api: controller + router

`Classes/Controller/TenantController.php` gains:
- `seedContent(string $slug, ServerRequestInterface $request): ResponseInterface`
- `delete(string $slug): ResponseInterface`

`Classes/Middleware/ApiRouter.php` adds:
```php
if (preg_match('#^/tenants/([a-z0-9][a-z0-9_-]*)/content$#', $remainder, $m) && $method === 'POST') {
    return $this->tenant->seedContent($m[1], $request);
}
if (preg_match('#^/tenants/([a-z0-9][a-z0-9_-]*)$#', $remainder, $m) && $method === 'DELETE') {
    return $this->tenant->delete($m[1]);
}
```

### D. pipeline-app: update-mode UI + executor branches

New `PipelineConfig` fields:
```ts
operatingMode: 'create' | 'update';
existingTenantSlug: string;           // populated in update mode
updateOps: {
    settings: boolean;       // PATCH /tenants/{slug}
    content: boolean;        // POST /tenants/{slug}/content
    redeploy: boolean;       // flyctl deploy (idempotent)
    retireFirst: boolean;    // DELETE /tenants/{slug} before re-create
};
```

Form additions (top of ConfigForm.svelte, after the env selector):
- Operating mode radio: `Create new` | `Update existing`.
- When `update`:
  - Tenant slug input
  - Checkboxes for the four operations
- When `create`:
  - "Retire if exists" checkbox (calls DELETE first, then POST). Useful
    for cleaning up orphans without leaving the form.

Executor (`stagingPhase`):
```
if (operatingMode === 'update') {
    skip POST /tenants
    skip poll
    if (updateOps.settings) → PATCH /tenants/{existingTenantSlug}
    if (updateOps.content)  → load seed → POST /tenants/{existingTenantSlug}/content
    if (updateOps.redeploy) → flyctl apps create + secrets set + deploy
} else {
    if (retireFirst) → DELETE /tenants/{slug}
    POST /tenants
    POST /tenants/{slug}/content    ← always; new step
    flyctl apps create + secrets set + deploy
}
```

The `content` POST in the create path is always-on — no more "tenant
exists but page is empty" surprises. If the operator wants infrastructure
only (no content), they can use update-mode with no ops checked + then
manually re-run with content later.

## Implementation Plan

1. **factory-core**: `TenantContentSeeder` + `TenantRetirementService`. Test
   each with a CLI runner first to make sure the SQL + DataHandler flow is
   correct before exposing via HTTP.
2. **factory-multitenant-api**: controller methods + router patterns +
   audit logging.
3. **pipeline-app**: types + form + executor. svelte-check.
4. **Release chain**: factory-core 0.4.0 (feat — new services), then
   factory-multitenant-api 0.2.0 (feat — new endpoints, requires the new
   factory-core), then deploy repo lock + push.

## Examples

### Update existing tenant — content + redeploy

Form values:
- Operating mode: Update existing
- Existing tenant slug: `heckelsmueller-test-1`
- Update settings: off
- Re-seed content: on
- Redeploy frontend: on
- Selected seed: heckelsmüller (the elements come from the seed)

Pipeline events (no POST /tenants, no poll):
```
POST /api/multitenant/tenants/heckelsmueller-test-1/content (elements from seed)
→ {seeded: 4, wiped: 0, status: seeded}
flyctl deploy --remote-only --app heckelsmueller-test-1-frontend
→ deployed
```

### Cleanup orphans then re-create

Form values:
- Operating mode: Create new
- Project name: heckelsmueller-test-3
- Retire if exists: on (so DELETE /heckelsmueller-test-3 runs first)

Pipeline (in addition to everything else):
```
DELETE /api/multitenant/tenants/heckelsmueller-test-3
→ {deleted: {pages: 0, ...}, status: retired}     (no-op if didn't exist)
POST /tenants
POST /tenants/heckelsmueller-test-3/content
flyctl …
```

## Trade-offs

✅ **Content seeding as a separate endpoint** keeps `POST /tenants` focused
on infrastructure. Re-seeding on an existing tenant is just calling the
same endpoint again — no special "update" verb needed for content.

✅ **Manual slug input** for update mode is honest about what we have today
(no tenant DB). Easy to upgrade later to a dropdown from `GET /tenants` or
a SQLite cache without breaking the contract.

✅ **DELETE is best-effort**: missing be_groups or filemounts don't fail
the operation. Lets it serve as cleanup for half-provisioned tenants too.

⚠️ **DELETE doesn't touch be_users.** A real customer admin user that
exists across tenants would survive retire. v2 follow-up: optional
`delete_admins` flag, or a separate users-cleanup endpoint.

⚠️ **No tenant DB in pipeline-app yet.** The operator copy-pastes the slug
each time they iterate. Once we see how much that hurts, the SQLite path
from DL #014 extends to track tenants too.

⚠️ **`content` POST always runs in create path.** No flag to opt out. If
someone wants the historical "infrastructure-only" behaviour, they pick
update-mode with no ops checked + add content later. Net simpler UX.

## Out of scope / follow-ups

- SQLite-backed tenant operations history (DL #014 had the file at
  `pipeline-app/.data/seeds.db`; extending it to `tenants.db` is natural
  next step but not blocking).
- `GET /tenants` dropdown in pipeline-app's update-mode picker.
- Optimistic concurrency (ETag/If-Match) on PATCH and content POST.
- Multi-tenant batch operations (one pipeline run touches N tenants).
- Async provisioning (today everything's sync; if any operation grows
  past ~10s the response shape needs job IDs).

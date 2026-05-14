import { env } from '$env/dynamic/private';
import { listTenants, type TenantSummary, StagingApiError } from '$lib/staging/api.js';
import type { PageServerLoad } from './$types';

interface ProvisionedRow {
	id: string;
	environment: string;
	tenant_slug: string | null;
	project_name: string | null;
	factory_core_version: string | null;
	applied_at: string;
	seed: { id: string; slug: string; name: string; client?: { id: string; slug: string; display_name: string } } | null;
}

interface MergedRow {
	slug: string;
	domain: string | null;
	status: 'ready' | 'tracked-only' | 'orphan';
	live: TenantSummary | null;
	provisioned: ProvisionedRow | null;
}

/**
 * Live tenant list. Queries the multitenant API (`GET /api/multitenant/tenants`)
 * and joins with `applied_seeds` so we surface BOTH:
 *   1. Tenants the API reports — even ones provisioned before pipeline-app
 *      was tracking them (status: 'orphan' if no applied_seeds row).
 *   2. applied_seeds rows whose tenant isn't on the live instance anymore
 *      (status: 'tracked-only' — stale audit data).
 */
export const load: PageServerLoad = async ({ locals }) => {
	const token = env.STAGING_API_TOKEN?.trim();
	const { data: defaults } = await locals.supabase
		.from('team_defaults')
		.select('staging_api_base_url')
		.limit(1)
		.maybeSingle();
	const baseUrl = defaults?.staging_api_base_url?.trim() ?? '';

	const { data: applied } = await locals.supabase
		.from('applied_seeds')
		.select(
			`
			id,
			environment,
			tenant_slug,
			project_name,
			factory_core_version,
			applied_at,
			seed:seeds ( id, slug, name, client:clients ( id, slug, display_name ) )
		`
		)
		.in('environment', ['staging', 'prod'])
		.order('applied_at', { ascending: false });

	const provisionedBySlug = new Map<string, ProvisionedRow>();
	for (const row of (applied ?? []) as unknown as ProvisionedRow[]) {
		if (row.tenant_slug) provisionedBySlug.set(row.tenant_slug, row);
	}

	let live: TenantSummary[] = [];
	let liveError: string | null = null;
	if (!baseUrl) {
		liveError = 'team_defaults.staging_api_base_url is empty — set it to enable live tenant listing.';
	} else if (!token) {
		liveError = 'STAGING_API_TOKEN missing on the server.';
	} else {
		try {
			live = await listTenants(baseUrl, token);
		} catch (err) {
			liveError =
				err instanceof StagingApiError
					? `Live fetch failed (HTTP ${err.status}): ${err.message}`
					: `Live fetch failed: ${(err as Error).message}`;
		}
	}

	const merged = new Map<string, MergedRow>();
	for (const t of live) {
		merged.set(t.slug, {
			slug: t.slug,
			domain: t.domain,
			status: 'ready',
			live: t,
			provisioned: provisionedBySlug.get(t.slug) ?? null
		});
	}
	for (const [slug, provisioned] of provisionedBySlug) {
		if (merged.has(slug)) continue;
		// applied_seeds knows about it but the live API doesn't — possible if
		// someone deleted the tenant outside pipeline-app, or the API is down.
		merged.set(slug, {
			slug,
			domain: null,
			status: liveError ? 'tracked-only' : 'tracked-only',
			live: null,
			provisioned
		});
	}

	return {
		rows: [...merged.values()],
		liveError,
		baseUrl
	};
};
